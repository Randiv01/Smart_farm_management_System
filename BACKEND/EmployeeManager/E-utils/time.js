// Always compute using Asia/Colombo
const TZ = "Asia/Colombo";

function nowColombo() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}

function toColombo(date) {
  return new Date(new Date(date).toLocaleString("en-US", { timeZone: TZ }));
}

function ymd(d = nowColombo()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function eightAM(dateObj) {
  // 08:00 at Asia/Colombo for given date
  const d = toColombo(dateObj || nowColombo());
  const at8 = new Date(d);
  at8.setHours(8, 0, 0, 0);
  return at8;
}

function isAfter8AM(dateObj) {
  const d = toColombo(dateObj || nowColombo());
  return d.getTime() > eightAM(d).getTime();
}

function startOfWeek(dateObj = nowColombo()) {
  // Monday as start (ISO-like): 1..7
  const d = toColombo(dateObj);
  const day = (d.getDay() + 6) % 7; // 0=Mon .. 6=Sun
  const s = new Date(d);
  s.setDate(d.getDate() - day);
  s.setHours(0, 0, 0, 0);
  return s;
}

function endOfWeek(dateObj = nowColombo()) {
  const s = startOfWeek(dateObj);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

function startOfMonth(dateObj = nowColombo()) {
  const d = toColombo(dateObj);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(dateObj = nowColombo()) {
  const d = toColombo(dateObj);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

module.exports = {
  TZ,
  nowColombo,
  toColombo,
  ymd,
  eightAM,
  isAfter8AM,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
};
