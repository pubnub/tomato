export const timetoken = {
  now() {
    return Date.now().toString(10) + ((process.uptime() * 1000) % 1).toString(10).substring(2, 6)
  },
}
