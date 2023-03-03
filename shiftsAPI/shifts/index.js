const casual = require('casual')

module.exports = () => {
  casual.define('shift', function () {
    return {
      employee: casual.full_name,
      shift: casual.am_pm,
      day: casual.day_of_week,
      month: casual.month_name,
      address: casual.street,
      city: casual.city,
      id: casual.uuid
    }
  })
  const data = {
    shifts: []
  }

  for (let i = 0; i < 100; i++) {
    data.shifts.push(casual.shift)
  }
  return data
}
