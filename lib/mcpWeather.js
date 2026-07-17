export const WEATHER_MCP_PROTOCOL_VERSION = '2025-11-25'

export const WEATHER_MCP_SUPPORTED_PROTOCOL_VERSIONS = new Set([
  '2025-11-25',
  '2025-06-18',
  '2025-03-26',
])

const WEATHER_CODES = {
  0: '晴朗',
  1: '大部晴朗',
  2: '局部多云',
  3: '阴天',
  45: '有雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '毛毛雨',
  55: '强毛毛雨',
  56: '轻微冻毛毛雨',
  57: '强冻毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '轻微冻雨',
  67: '强冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '米雪',
  80: '小阵雨',
  81: '中阵雨',
  82: '强阵雨',
  85: '小阵雪',
  86: '强阵雪',
  95: '雷暴',
  96: '雷暴伴小冰雹',
  99: '雷暴伴强冰雹',
}

const LOCATION_PROPERTIES = {
  name: { type: 'string' },
  country: { type: 'string' },
  admin1: { type: 'string' },
  latitude: { type: 'number' },
  longitude: { type: 'number' },
  timezone: { type: 'string' },
}

const CURRENT_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    location: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
      required: ['name', 'country', 'admin1', 'latitude', 'longitude', 'timezone'],
      additionalProperties: false,
    },
    observedAt: { type: 'string' },
    weather: { type: 'string' },
    temperature: { type: 'number' },
    apparentTemperature: { type: 'number' },
    relativeHumidity: { type: 'number' },
    precipitation: { type: 'number' },
    windSpeed: { type: 'number' },
    windDirection: { type: 'number' },
    isDay: { type: 'boolean' },
    units: {
      type: 'object',
      properties: {
        temperature: { type: 'string' },
        relativeHumidity: { type: 'string' },
        precipitation: { type: 'string' },
        windSpeed: { type: 'string' },
        windDirection: { type: 'string' },
      },
      required: ['temperature', 'relativeHumidity', 'precipitation', 'windSpeed', 'windDirection'],
      additionalProperties: false,
    },
    source: { type: 'string', format: 'uri' },
  },
  required: ['location', 'observedAt', 'weather', 'temperature', 'apparentTemperature', 'relativeHumidity', 'precipitation', 'windSpeed', 'windDirection', 'isDay', 'units', 'source'],
  additionalProperties: false,
}

const FORECAST_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    location: {
      type: 'object',
      properties: LOCATION_PROPERTIES,
      required: ['name', 'country', 'admin1', 'latitude', 'longitude', 'timezone'],
      additionalProperties: false,
    },
    forecast: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          weather: { type: 'string' },
          temperatureMax: { type: 'number' },
          temperatureMin: { type: 'number' },
          precipitationProbabilityMax: { type: 'number' },
          precipitation: { type: 'number' },
          windSpeedMax: { type: 'number' },
        },
        required: ['date', 'weather', 'temperatureMax', 'temperatureMin', 'precipitationProbabilityMax', 'precipitation', 'windSpeedMax'],
        additionalProperties: false,
      },
    },
    units: {
      type: 'object',
      properties: {
        temperature: { type: 'string' },
        precipitationProbability: { type: 'string' },
        precipitation: { type: 'string' },
        windSpeed: { type: 'string' },
      },
      required: ['temperature', 'precipitationProbability', 'precipitation', 'windSpeed'],
      additionalProperties: false,
    },
    source: { type: 'string', format: 'uri' },
  },
  required: ['location', 'forecast', 'units', 'source'],
  additionalProperties: false,
}

const LOCATION_INPUT = {
  type: 'string',
  minLength: 2,
  maxLength: 100,
  description: '城市、地区或邮政编码，例如“广州”“深圳”或“Tokyo”。',
}

export const WEATHER_MCP_TOOLS = [
  {
    name: 'get_current_weather',
    title: '查询实时天气',
    description: '按城市或地区名称查询当前天气、温度、湿度、降水和风况。',
    inputSchema: {
      type: 'object',
      properties: { location: LOCATION_INPUT },
      required: ['location'],
      additionalProperties: false,
    },
    outputSchema: CURRENT_OUTPUT_SCHEMA,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: 'get_weather_forecast',
    title: '查询天气预报',
    description: '按城市或地区名称查询未来 1 至 7 天的天气预报。',
    inputSchema: {
      type: 'object',
      properties: {
        location: LOCATION_INPUT,
        days: { type: 'integer', minimum: 1, maximum: 7, default: 3, description: '预报天数，默认 3 天，最多 7 天。' },
      },
      required: ['location'],
      additionalProperties: false,
    },
    outputSchema: FORECAST_OUTPUT_SCHEMA,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
]

function toolError(message) {
  return { content: [{ type: 'text', text: message }], isError: true }
}

function toolResult(structuredContent) {
  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
  }
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function locationPayload(result) {
  return {
    name: String(result.name || ''),
    country: String(result.country || result.country_code || ''),
    admin1: String(result.admin1 || ''),
    latitude: finiteNumber(result.latitude),
    longitude: finiteNumber(result.longitude),
    timezone: String(result.timezone || 'auto'),
  }
}

async function fetchJson(url, fetchImpl) {
  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'tuaran-weather-mcp/1.0' },
  })
  if (!response.ok) throw new Error(`天气数据源返回 HTTP ${response.status}`)
  return response.json()
}

async function resolveLocation(query, fetchImpl) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '1')
  url.searchParams.set('language', 'zh')
  url.searchParams.set('format', 'json')
  const data = await fetchJson(url, fetchImpl)
  const result = Array.isArray(data?.results) ? data.results[0] : null
  if (!result) return null
  return result
}

function normalizeInput(args) {
  const input = args && typeof args === 'object' && !Array.isArray(args) ? args : {}
  const location = String(input.location || '').trim()
  if (location.length < 2 || location.length > 100) return { error: 'location 必须为 2 到 100 个字符。' }
  return { input, location }
}

export async function callWeatherMcpTool(name, args, fetchImpl = fetch) {
  const normalized = normalizeInput(args)
  if (normalized.error) return toolError(normalized.error)

  if (!['get_current_weather', 'get_weather_forecast'].includes(name)) return null

  try {
    const resolved = await resolveLocation(normalized.location, fetchImpl)
    if (!resolved) return toolError(`没有找到地点：${normalized.location}`)
    const location = locationPayload(resolved)
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', String(location.latitude))
    url.searchParams.set('longitude', String(location.longitude))
    url.searchParams.set('timezone', location.timezone || 'auto')

    if (name === 'get_current_weather') {
      url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m')
      const data = await fetchJson(url, fetchImpl)
      const current = data?.current || {}
      const units = data?.current_units || {}
      return toolResult({
        location,
        observedAt: String(current.time || ''),
        weather: WEATHER_CODES[current.weather_code] || `未知天气代码 ${current.weather_code}`,
        temperature: finiteNumber(current.temperature_2m),
        apparentTemperature: finiteNumber(current.apparent_temperature),
        relativeHumidity: finiteNumber(current.relative_humidity_2m),
        precipitation: finiteNumber(current.precipitation),
        windSpeed: finiteNumber(current.wind_speed_10m),
        windDirection: finiteNumber(current.wind_direction_10m),
        isDay: Number(current.is_day) === 1,
        units: {
          temperature: String(units.temperature_2m || '°C'),
          relativeHumidity: String(units.relative_humidity_2m || '%'),
          precipitation: String(units.precipitation || 'mm'),
          windSpeed: String(units.wind_speed_10m || 'km/h'),
          windDirection: String(units.wind_direction_10m || '°'),
        },
        source: 'https://open-meteo.com/',
      })
    }

    const parsedDays = Number(normalized.input.days)
    const days = Number.isInteger(parsedDays) ? Math.min(7, Math.max(1, parsedDays)) : 3
    url.searchParams.set('forecast_days', String(days))
    url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max')
    const data = await fetchJson(url, fetchImpl)
    const daily = data?.daily || {}
    const dailyUnits = data?.daily_units || {}
    const dates = Array.isArray(daily.time) ? daily.time : []
    return toolResult({
      location,
      forecast: dates.map((date, index) => ({
        date: String(date),
        weather: WEATHER_CODES[daily.weather_code?.[index]] || `未知天气代码 ${daily.weather_code?.[index]}`,
        temperatureMax: finiteNumber(daily.temperature_2m_max?.[index]),
        temperatureMin: finiteNumber(daily.temperature_2m_min?.[index]),
        precipitationProbabilityMax: finiteNumber(daily.precipitation_probability_max?.[index]),
        precipitation: finiteNumber(daily.precipitation_sum?.[index]),
        windSpeedMax: finiteNumber(daily.wind_speed_10m_max?.[index]),
      })),
      units: {
        temperature: String(dailyUnits.temperature_2m_max || '°C'),
        precipitationProbability: String(dailyUnits.precipitation_probability_max || '%'),
        precipitation: String(dailyUnits.precipitation_sum || 'mm'),
        windSpeed: String(dailyUnits.wind_speed_10m_max || 'km/h'),
      },
      source: 'https://open-meteo.com/',
    })
  } catch (error) {
    return toolError(`天气查询暂时不可用：${error?.message || '未知错误'}`)
  }
}

export function weatherMcpInitializeResult(requestedVersion) {
  const protocolVersion = WEATHER_MCP_SUPPORTED_PROTOCOL_VERSIONS.has(requestedVersion)
    ? requestedVersion
    : WEATHER_MCP_PROTOCOL_VERSION
  return {
    protocolVersion,
    capabilities: { tools: {} },
    serverInfo: {
      name: 'tuaran-weather-test',
      title: '天气查询测试 MCP',
      version: '1.0.0',
      description: '无需登录，按城市查询实时天气和未来 7 天天气预报。',
      websiteUrl: 'https://2aran.com/mcp-center',
    },
    instructions: '用户询问某地天气时，调用 get_current_weather；询问未来几天的天气时，调用 get_weather_forecast。天气数据来自 Open-Meteo。',
  }
}
