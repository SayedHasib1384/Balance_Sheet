// QUERY SELECTORS
const theme = document.querySelector("#theme")
const print_button = document.querySelector("#print-button")
const form = document.querySelector("#balanceForm")
const categoryWrapper = document.querySelector("#categoryWrapper")
const assetsContent = document.querySelector("#assetsContent")
const liabilitiesContent = document.querySelector("#liabilitiesContent")
const assetsTotal = document.querySelector("#assetsTotal")
const liabilitiesTotal = document.querySelector("#liabilitiesTotal")
const chartCanvas = document.querySelector("#balanceChart").getContext("2d")
const companyNameElement = document.querySelector("#companyName")
const dateElement = document.querySelector("#currentDate")
const addBtn = document.querySelector("#addBtn")
const formContainer = document.querySelector(".form-container")
const editModal = document.querySelector("#editModal")
const editTitle = document.querySelector("#editTitle")
const editAmount = document.querySelector("#editAmount")
const editSide = document.querySelector("#editSide")
const saveEdit = document.querySelector("#saveEdit")
const cancelEdit = document.querySelector("#cancelEdit")
const backToTop = document.querySelector("#backToTop")


// LocalStorage
let data = JSON.parse(localStorage.getItem("balanceData")) || {
  asset: [],
  liability: [],
  equity: []
}

function saveData() {
  localStorage.setItem("balanceData", JSON.stringify(data))
}

// UTILITY FUNCTIONS 

// ID
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
}

// فرمت عدد به فارسی
function format(num) {
  return Number(num).toLocaleString("fa-AF") + " ؋"
}

function sumOf(items) {
  return items.reduce((total, item) => total + (Number(item.amount) || 0), 0)
}

// COMPANY NAME
const savedName = localStorage.getItem("companyName")
if (savedName) companyNameElement.textContent = savedName

companyNameElement.addEventListener("click", () => {
  const currentName = companyNameElement.textContent
  const input = document.createElement("input")
  input.type = "text"
  input.value = currentName
  input.className = "company-input"

  companyNameElement.replaceWith(input)
  input.focus()

  const saveName = () => {
    const newName = input.value.trim() || "شرکت بدون نام"
    localStorage.setItem("companyName", newName)
    const newHeading = document.createElement("h1")
    newHeading.id = "companyName"
    newHeading.textContent = newName
    input.replaceWith(newHeading)
    newHeading.addEventListener("click", () => companyNameElement.click())
  }

  input.addEventListener("blur", saveName)
  input.addEventListener("keydown", e => e.key === "Enter" && saveName())
})

// DATE
const savedDate = localStorage.getItem("companyDate")
if (savedDate) {
  dateElement.textContent = savedDate
} else {
  const today = new Date()
  const formatted = today.toLocaleDateString('fa-AF', { year: 'numeric', month: 'long', day: 'numeric' })
  dateElement.textContent = formatted
  localStorage.setItem("companyDate", formatted)
}

dateElement.addEventListener("click", () => {
  const currentValue = dateElement.textContent
  const input = document.createElement("input")
  input.type = "date"
  input.className = "date-input"

  dateElement.replaceWith(input)
  input.focus()

  const saveDate = () => {
    if (input.value) {
      const newDate = new Date(input.value)
      const formatted = newDate.toLocaleDateString('fa-AF', { year: 'numeric', month: 'long', day: 'numeric' })
      localStorage.setItem("companyDate", formatted)
      const newP = document.createElement("p")
      newP.id = "currentDate"
      newP.textContent = formatted
      newP.addEventListener("click", () => dateElement.click())
      input.replaceWith(newP)
    } else input.blur()
  }

  input.addEventListener("blur", saveDate)
  input.addEventListener("keydown", e => e.key === "Enter" && saveDate())
})

// Table
function createTable(items, type) {
  if (!items.length) return "<p>-</p>"
  return `
    <table>
      <tr>
      <th>عنوان</th>
      <th>دبیت</th>
      <th>کردیت</th>
      <th>ویرایش</th>
      <th>حذف</th>
      </tr>
      ${items.map(it => `
        <tr>
          <td>${it.title}</td>
          <td>${it.side === "debit" ? format(it.amount) : "-"}</td>
          <td>${it.side === "credit" ? format(it.amount) : "-"}</td>
          <td><button class="edit-btn" data-type="${type}" data-id="${it.id}">✏️</button></td>
          <td><button class="delete-btn" data-type="${type}" data-id="${it.id}">❌</button></td>
        </tr>`).join("")}
    </table>`
}

function groupByCategory(type) {
  const items = data[type]
  if (!items.length) return "<p>آیتمی وجود ندارد</p>"

  if (type === "equity") return createTable(items, type)

  const current = items.filter(i => i.category === "current")
  const noncurrent = items.filter(i => i.category === "noncurrent")

  const title = type === "asset" ? "دارایی" : "بدهی"
  return `
    <div>
      <h3>${title}‌های جاری</h3>${createTable(current, type)}
      <h3>${title}‌های غیرجاری</h3>${createTable(noncurrent, type)}
    </div>`
}

function updateTotals() {
  const assetSum = sumOf(data.asset)
  const liabSum = sumOf(data.liability)
  const equitySum = sumOf(data.equity)
  assetsTotal.textContent = format(assetSum)
  liabilitiesTotal.textContent = format(liabSum + equitySum)
}

// CHART RENDER
let chart
function renderChart() {
  const assetSum = sumOf(data.asset)
  const liabilitySum = sumOf(data.liability)
  const equitySum = sumOf(data.equity)
  if (chart) chart.destroy()

  chart = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels: ["دارایی", "بدهی", "سرمایه"],
      datasets: [{
        data: [assetSum, liabilitySum, equitySum],
        backgroundColor: ["#4CAF50", "#F44336", "#2196F3"]
      }]
    },
    options: { plugins: { legend: { position: "bottom" } } }
  })
}

// MAIN RENDER
function render() {
  assetsContent.innerHTML = groupByCategory("asset")
  liabilitiesContent.innerHTML = groupByCategory("liability") + `
    <h3>سرمایه مالکان</h3>${groupByCategory("equity")}
  `
  updateTotals()
  renderChart()
}

// EVENT LISTENERS
print_button.addEventListener("click", () => window.print())
theme.addEventListener("click", () => {
  document.body.classList.toggle("dark")
  theme.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙"
})

document.querySelector("#resetBtn").addEventListener("click", () => {
  if (confirm("آیا مطمئن هستید که همه اطلاعات حذف شود؟")) {
    localStorage.clear()
    location.reload()
  }
})

form.addEventListener("submit", e => {
  e.preventDefault()
  const type = form.type.value
  let category = form.category.value
  const title = form.title.value.trim()
  const amount = Number(form.amount.value)
  const side = form.side.value

  if (type === "equity") category = "none"
  if (!type || !title || !amount || !side) return alert("همه فیلدها را پر کنید")

  data[type].push({ id: genId(), type, category, title, amount, side })
  saveData()
  form.reset()
  render()
})

// پنهان
form.type.addEventListener("change", e => {
  categoryWrapper.style.display = e.target.value === "equity" ? "none" : "block"
})

document.addEventListener("click", e => {
  if (e.target.classList.contains("delete-btn")) {
    const { type, id } = e.target.dataset
    data[type] = data[type].filter(i => i.id !== id)
    saveData()
    render()
  }
})

let editingType = null
let editingId = null

document.addEventListener("click", e => {
  if (e.target.classList.contains("edit-btn")) {
    const { type, id } = e.target.dataset
    const item = data[type].find(i => i.id === id)
    if (!item) return

    editingType = type
    editingId = id
    editTitle.value = item.title
    editAmount.value = item.amount
    editSide.value = item.side
    editModal.style.display = "flex"
  }
})

cancelEdit.addEventListener("click", () => editModal.style.display = "none")

saveEdit.addEventListener("click", () => {
  if (!editingType || !editingId) return
  const title = editTitle.value.trim()
  const amount = Number(editAmount.value)
  const side = editSide.value
  if (!title || !amount) return alert("تمام فیلدها را پر کنید")

  const item = data[editingType].find(i => i.id === editingId)
  if (item) Object.assign(item, { title, amount, side })
  saveData()
  render()
  editModal.style.display = "none"
})

addBtn.addEventListener("click", () => {
  formContainer.scrollIntoView({ behavior: "smooth", block: "center" })
})

window.addEventListener("scroll", () => {
  backToTop.style.display = window.scrollY > 250 ? "block" : "none"
})
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" })
})

//INITIAL LOAD
render()