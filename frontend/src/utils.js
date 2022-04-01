export default new class Utils {
  setIntersection (sa, sb) {
    const result = [...sa.values()].filter(x => sb.has(x))
    return new Set(result)
  }

  arrayIntersection (a, b) {
    const sb = new Set(b)
    const result = [...a.values()].filter(x => sb.has(x))
    return result
  }
}()
