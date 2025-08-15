import type {
  RawMessage,
  Reading,
  ProcessedData,
  P0Settings,
  ChartDataPoint
} from '../types';
import { VALID_COUNTER_TYPES, DEFAULT_RAIN_CHANNEL, VOLTAGE_CHANNEL } from '../constants';

/* ===================== Normalização / Utils ===================== */

// Alguns caminhos chegam como msg.data.* (WS) e outros como msg.* (REST)
const metaOf = (m: any) => m?.commMetaData ?? m?.data?.commMetaData ?? null;
const readingsOf = (m: any): Reading[] => m?.readings ?? m?.data?.readings ?? [];

const MAX_UINT32 = 0xFFFFFFFF;

const getDayInTimezone = (date: Date, tz: string): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

// Tempo para CÁLCULO físico (prioriza readTimestamp; fallback receivedTimestamp)
export const getMessageTimestamp = (msg: RawMessage): number => {
  const meta = metaOf(msg);
  const ts = (msg as any).readTimestamp ?? meta?.receivedTimestamp;
  return ts ? new Date(ts).getTime() : 0;
};

// Tempo de CHEGADA (gatilho visual em tempo real)
export const getReceptionTimestamp = (msg: RawMessage): number => {
  const meta = metaOf(msg);
  const ts = meta?.receivedTimestamp ?? (msg as any).readTimestamp;
  return ts ? new Date(ts).getTime() : 0;
};

const getSequenceNumber = (counter: number | number[] | undefined): number | null => {
  if (Array.isArray(counter)) return counter[0] ?? null;
  if (typeof counter === 'number') return counter;
  return null;
};

export const isCounterReading = (reading: Reading): boolean => {
  return (
    !!reading &&
    typeof reading.readingType === 'string' &&
    VALID_COUNTER_TYPES.has(reading.readingType.toLowerCase()) &&
    [1, 2, 3].includes(reading.channel)
  );
};

export const computeDeltaPulses = (prev: number, curr: number): number => {
  if (curr < prev) {
    if (prev > 4_000_000_000) {
      return (MAX_UINT32 - prev) + curr + 1; // rollover 32 bits
    }
    return 0; // reset não plausível → descarta
  }
  return curr - prev;
};

const pickLastNumber = (msgs: RawMessage[], picker: (m: any) => any): number | null => {
  for (let i = msgs.length - 1; i >= 0; i--) {
    const v = picker(msgs[i]);
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const findLastTemperature = (sortedByCalcTs: RawMessage[]): number | null => {
  for (let i = sortedByCalcTs.length - 1; i >= 0; i--) {
    const msg: any = sortedByCalcTs[i];
    if (!msg) continue;
    if (typeof msg.temperatureDegrees === 'number') return msg.temperatureDegrees;
    const rds = readingsOf(msg);
    const tempReading = rds.find(
      (r: any) => r && typeof r.readingType === 'string' && r.readingType.toLowerCase() === 'temperature'
    );
    if (tempReading) {
      const temp = parseFloat(tempReading.readingData);
      if (!isNaN(temp)) return temp;
    }
  }
  return null;
};

const findLastVoltage = (messages: RawMessage[]): number | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const r = readingsOf(messages[i]).find(
      (rr: any) => rr && rr.channel === VOLTAGE_CHANNEL && rr.readingType === 'Voltage'
    );
    if (r) {
      const v = parseFloat((r as any).readingData);
      if (!isNaN(v)) return v;
    }
  }
  return null;
};

/** Dedupe/merge para fluxo em tempo real (WS/polling incremental).
 *  Chave: topic + nodeId + receivedTimestamp + sequenceCounter
 */
export const mergeIncrementalMessages = (
  existing: RawMessage[],
  incoming: RawMessage[],
  maxKeep: number = 5000
): RawMessage[] => {
  const map = new Map<string, RawMessage>();
  const push = (m: any) => {
    const topic = m?.topic ?? m?.data?.topic ?? 'unknown';
    const nodeId = m?.nodeId ?? 'unk';
    const meta = metaOf(m);
    const rx = meta?.receivedTimestamp ?? m?.readTimestamp ?? '';
    const seqRaw = meta?.sequenceCounter;
    const seq = Array.isArray(seqRaw) ? (seqRaw[0] ?? '') : (seqRaw ?? '');
    const key = `${topic}|${nodeId}|${rx}|${seq}`;
    map.set(key, m as RawMessage);
  };
  existing.forEach(push);
  incoming.forEach(push);

  const merged = Array.from(map.values()).sort(
    (a, b) => getMessageTimestamp(a) - getMessageTimestamp(b)
  );
  return merged.length > maxKeep ? merged.slice(-maxKeep) : merged;
};

/* ===================== Processamento principal ===================== */

export const processSeries = (
  rawMessages: RawMessage[],
  K: number,               // mm por pulso (ex.: 0.1)
  P0: P0Settings,          // offsets lógicos por canal (pulsos)
  tz: string
): ProcessedData => {
  const emptyState: ProcessedData = {
    chartData: [],
    kpis: {
      rainToday: 0,
      maxIntensityToday: 0,
      lastReadingTimestamp: null,
      voltage: null,
      rssi: null,
      snr: null,
      temperature: null
    },
    hasPulseData: false,
    lastPulseTimestamp: null
  };
  if (!rawMessages?.length) return emptyState;

  // 1) Ordenação para CÁLCULO (usa readTimestamp como prioridade)
  const sortedCalc = [...rawMessages].sort(
    (a, b) => getMessageTimestamp(a) - getMessageTimestamp(b)
  );

  // 2) Último pacote por CHEGADA (KPIs vivos)
  const latestByRx = rawMessages.reduce<{ msg: RawMessage | null; rx: number }>(
    (acc, m) => {
      const rx = getReceptionTimestamp(m);
      if (rx >= acc.rx) return { msg: m, rx };
      return acc;
    },
    { msg: null, rx: 0 }
  ).msg;

  // 3) Janela de performance (hoje + ontem) para gráficos
  const now = new Date();
  const todayStr = getDayInTimezone(now, tz);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = getDayInTimezone(yesterday, tz);

  const recentCalc = sortedCalc.filter(m => {
    const ts = getMessageTimestamp(m);
    if (!ts) return false;
    const day = getDayInTimezone(new Date(ts), tz);
    return day === todayStr || day === yesterdayStr;
  });

  let processing = recentCalc;
  if (recentCalc.length > 0 && sortedCalc.length > recentCalc.length) {
    const firstRecent = recentCalc[0];
    const idx = sortedCalc.findIndex(m => m === firstRecent);
    if (idx > 0) processing = [sortedCalc[idx - 1], ...recentCalc];
  }

  /* -------------------- Loop de cálculo -------------------- */

  const chartData: ChartDataPoint[] = [];
  let daily_acc_mm = 0;
  let hasPulseData = false;
  let lastPulseTimestamp: string | null = null;

  // Canal de chuva fixo conforme seu setup (constants.ts → DEFAULT_RAIN_CHANNEL = 2)
  const RAIN_CH = DEFAULT_RAIN_CHANNEL ?? 2;

  for (let i = 1; i < processing.length; i++) {
    const prevMsg: any = processing[i - 1];
    const currMsg: any = processing[i];

    const prevReadings = readingsOf(prevMsg);
    const currReadings = readingsOf(currMsg);
    if (!Array.isArray(prevReadings) || !Array.isArray(currReadings)) continue;

    const prevCalcMs = getMessageTimestamp(prevMsg);
    const currCalcMs = getMessageTimestamp(currMsg);
    if (!prevCalcMs || !currCalcMs) continue;

    const prevCalc = new Date(prevCalcMs);
    const currCalc = new Date(currCalcMs);
    const delta_t_hours = (currCalc.getTime() - prevCalc.getTime()) / 3_600_000;
    if (delta_t_hours <= 0) continue;

    // 3.1 Pega a leitura do canal fixo
    const currCounter = currReadings.find((r: any) =>
      r &&
      typeof r.readingType === 'string' &&
      VALID_COUNTER_TYPES.has(r.readingType.toLowerCase()) &&
      r.channel === RAIN_CH
    );

    let interval_mm = 0;

    if (currCounter) {
      hasPulseData = true;
      lastPulseTimestamp = new Date(currCalcMs).toISOString();

      // 3.2 PRIORIDADE: usar mm do gateway quando existir
      if (
        currCounter.engineeringUnit?.toLowerCase() === 'mm' &&
        typeof currCounter.engineeringValue === 'number' &&
        Number.isFinite(currCounter.engineeringValue)
      ) {
        interval_mm = currCounter.engineeringValue;

        // proteção contra pico absurdo (em mm/h)
        const intensity_mm_h = interval_mm / delta_t_hours;
        if (intensity_mm_h > 500) interval_mm = 0;
      } else {
        // 3.3 FALLBACK: calcular via Δpulsos × K
        const prevCounter = prevReadings.find((r: any) =>
          r &&
          typeof r.readingType === 'string' &&
          VALID_COUNTER_TYPES.has(r.readingType.toLowerCase()) &&
          r.channel === RAIN_CH
        );

        if (prevCounter) {
          const prevP = parseInt(prevCounter.readingData, 10);
          const currP = parseInt(currCounter.readingData, 10);

          if (Number.isFinite(prevP) && Number.isFinite(currP)) {
            let dP = computeDeltaPulses(prevP, currP);
            const ratePulsesPerHour = dP / delta_t_hours;
            if (ratePulsesPerHour > 5000) dP = 0; // proteção de taxa
            interval_mm = dP * K;
          }
        }
      }
    }

    // 3.4 Intensidade e acumulados
    const intensity_mmh = delta_t_hours > 0 ? interval_mm / delta_t_hours : 0;

    // Zera acumulado na virada do dia local (baseado em readTimestamp)
    const prevDay = getDayInTimezone(prevCalc, tz);
    const currDay = getDayInTimezone(currCalc, tz);
    if (currDay !== prevDay) daily_acc_mm = 0;

    daily_acc_mm += interval_mm;

    // P0 apenas para exibição
    const p0 = P0[RAIN_CH] || 0;
    const display_daily_acc_mm = Math.max(0, daily_acc_mm - p0 * K);

    // Timestamp do ponto do gráfico: CHEGADA (tempo real)
    const rxMs = getReceptionTimestamp(currMsg);
    const tsIso = rxMs ? new Date(rxMs).toISOString() : new Date().toISOString();

    chartData.push({
      timestamp: tsIso,
      interval_mm: Number(interval_mm.toFixed(2)),
      intensity_mmh: Number(intensity_mmh.toFixed(2)),
      daily_acc_mm: Number(display_daily_acc_mm.toFixed(2))
    });
  }

  // Média móvel 10 pontos da intensidade
  const intensityData = chartData.map(d => d.intensity_mmh ?? 0);
  for (let j = 0; j < chartData.length; j++) {
    const start = Math.max(0, j - 9);
    const points = intensityData.slice(start, j + 1);
    const sum = points.reduce((acc, v) => acc + v, 0);
    chartData[j].intensity_ma_mmh = Number((sum / points.length).toFixed(2));
  }

  // KPIs de hoje (com base nos pontos já no fuso)
  const todayData = chartData.filter(
    d => getDayInTimezone(new Date(d.timestamp), tz) === todayStr
  );
  const rainToday = todayData.length ? todayData[todayData.length - 1].daily_acc_mm! : 0;
  const maxIntensityToday = todayData.length
    ? Math.max(...todayData.map(d => d.intensity_mmh ?? 0))
    : 0;

  // Últimos valores em tempo real e metadados
  const lastReceptionTs = rawMessages.reduce((max, m) => Math.max(max, getReceptionTimestamp(m)), 0);
  const latestCalcMsg = sortedCalc[sortedCalc.length - 1] ?? null;

  const voltage = findLastVoltage(rawMessages);
  const temperature = findLastTemperature(sortedCalc);

  // RSSI e SNR robustos
  const lastRssi = pickLastNumber(rawMessages, m => metaOf(m)?.rssi);
  const lastSnr  = pickLastNumber(rawMessages, m => metaOf(m)?.snr);

  return {
    chartData,
    kpis: {
      rainToday: Number(rainToday.toFixed(2)),
      maxIntensityToday: Number(maxIntensityToday.toFixed(2)),
      lastReadingTimestamp: lastReceptionTs
        ? new Date(lastReceptionTs).toISOString()
        : (latestCalcMsg ? new Date(getMessageTimestamp(latestCalcMsg)).toISOString() : null),
      voltage,
      rssi: lastRssi,
      snr: lastSnr,
      temperature: temperature !== null ? Number(temperature.toFixed(1)) : null
    },
    hasPulseData,
    lastPulseTimestamp
  };
};