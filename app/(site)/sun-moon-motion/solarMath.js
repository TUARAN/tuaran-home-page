export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function getEquationOfTimeMinutes(yearProgress = 0) {
  const normalizedProgress = ((yearProgress % 1) + 1) % 1
  const gamma = normalizedProgress * Math.PI * 2

  return 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  )
}

export function getSolarClockOffsetHours({ location, yearProgress = 0 }) {
  const longitude = location?.longitude || 0
  const utcOffset = location?.utcOffset ?? 0
  const standardLongitude = utcOffset * 15
  const equationOfTime = getEquationOfTimeMinutes(yearProgress)

  return (4 * (longitude - standardLongitude) + equationOfTime) / 60
}

export function getSolarTime({ time, location, yearProgress = 0 }) {
  return time + getSolarClockOffsetHours({ location, yearProgress })
}

export function getSolarHourAngleRadians({ time, location, yearProgress = 0 }) {
  return ((getSolarTime({ time, location, yearProgress }) - 12) / 24) * Math.PI * 2
}
