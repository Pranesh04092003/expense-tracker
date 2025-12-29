class ExpenseTracker {
  constructor() {
    this.transactions = JSON.parse(localStorage.getItem("transactions")) || []
    this.categories = JSON.parse(localStorage.getItem("categories")) || [
      "Food & Dining",
      "Transportation",
      "Entertainment",
      "Utilities",
      "Healthcare",
      "Shopping",
      "Education",
      "Other",
    ]
    this.currentView = "dashboard"
    this.chartInstances = {}
    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setDefaultDate()
    this.renderCategories()
    this.updateDashboard()
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => this.switchView(e.target.closest(".nav-btn").dataset.view))
    })

    // Add Transaction Buttons
    document.querySelectorAll("#addTransactionBtn, #addTransactionBtn2").forEach((btn) => {
      btn.addEventListener("click", () => this.openModal())
    })

    // Modal
    document.querySelector(".modal-close").addEventListener("click", () => this.closeModal())
    document.getElementById("transactionModal").addEventListener("click", (e) => {
      if (e.target.id === "transactionModal") this.closeModal()
    })

    // Form
    document.getElementById("transactionForm").addEventListener("submit", (e) => {
      e.preventDefault()
      this.saveTransaction()
    })

    // Filters
    document.getElementById("monthFilter").addEventListener("change", () => this.updateDashboard())
    document.getElementById("searchInput").addEventListener("input", () => this.filterTransactions())
    document.getElementById("categoryFilter").addEventListener("change", () => this.filterTransactions())
    document.getElementById("typeFilter").addEventListener("change", () => this.filterTransactions())
    document.getElementById("startDateFilter").addEventListener("change", () => this.filterTransactions())
    document.getElementById("endDateFilter").addEventListener("change", () => this.filterTransactions())

    // Categories
    document.getElementById("addCategoryBtn").addEventListener("click", () => this.addCategory())
    document.getElementById("newCategoryInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addCategory()
    })

    // Charts
    document.querySelectorAll(".chart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const chartType = e.target.dataset.chart
        this.switchChart(chartType)
      })
    })

    // Data Management & Export
    document.getElementById("exportBtn").addEventListener("click", () => this.exportDataJSON())
    document.getElementById("exportCSVBtn").addEventListener("click", () => this.exportDataCSV())
    document.getElementById("exportPDFBtn").addEventListener("click", () => this.exportDataPDF())
    // Settings section export buttons
    document.getElementById("exportCSVBtnSettings").addEventListener("click", () => this.exportDataCSV())
    document.getElementById("exportPDFBtnSettings").addEventListener("click", () => this.exportDataPDF())
    document.getElementById("clearBtn").addEventListener("click", () => this.clearAllData())

    // Transaction Type Change
    document.getElementById("transactionType").addEventListener("change", () => {
      this.updateCategorySelect()
    })
  }

  switchView(view) {
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"))
    document.getElementById(view).classList.add("active")
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-view="${view}"]`).classList.add("active")
    this.currentView = view

    if (view === "analytics") {
      setTimeout(() => this.initializeCharts(), 200)
    } else if (view === "transactions") {
      this.renderAllTransactions()
      this.updateCategoryFilterOptions()
    }
  }

  setDefaultDate() {
    const today = new Date()
    document.getElementById("transactionDate").valueAsDate = today
    document.getElementById("monthFilter").value = today.toISOString().slice(0, 7)
  }

  openModal() {
    document.getElementById("transactionModal").classList.add("active")
    this.setDefaultDate()
    this.updateCategorySelect()
  }

  closeModal() {
    document.getElementById("transactionModal").classList.remove("active")
    document.getElementById("transactionForm").reset()
  }

  updateCategorySelect() {
    const select = document.getElementById("transactionCategory")
    const type = document.getElementById("transactionType").value
    select.innerHTML = '<option value="">Select Category</option>'

    if (type === "income") {
      select.innerHTML += '<option value="Salary">Salary</option>'
      select.innerHTML += '<option value="Bonus">Bonus</option>'
      select.innerHTML += '<option value="Investment">Investment</option>'
      select.innerHTML += '<option value="Freelance">Freelance</option>'
      select.innerHTML += '<option value="Other Income">Other Income</option>'
    } else {
      this.categories.forEach((cat) => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`
      })
    }
  }

  updateCategoryFilterOptions() {
    const select = document.getElementById("categoryFilter")
    const currentValue = select.value
    select.innerHTML = '<option value="">All Categories</option>'

    const allCategories = new Set()
    this.transactions.forEach((t) => {
      allCategories.add(t.category)
    })

    Array.from(allCategories)
      .sort()
      .forEach((cat) => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`
      })

    select.value = currentValue
  }

  renderCategories() {
    const list = document.getElementById("categoriesList")
    list.innerHTML = this.categories
      .map(
        (cat) => `
            <div class="category-badge">
                ${cat}
                <button data-category="${cat}" type="button">×</button>
            </div>
        `,
      )
      .join("")

    list.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => this.removeCategory(btn.dataset.category))
    })
  }

  addCategory() {
    const input = document.getElementById("newCategoryInput")
    const cat = input.value.trim()

    if (cat && !this.categories.includes(cat)) {
      this.categories.push(cat)
      this.saveCategories()
      this.renderCategories()
      this.updateCategorySelect()
      input.value = ""
    } else if (this.categories.includes(cat)) {
      alert("This category already exists!")
    }
  }

  removeCategory(cat) {
    this.categories = this.categories.filter((c) => c !== cat)
    this.saveCategories()
    this.renderCategories()
    this.updateCategorySelect()
  }

  saveTransaction() {

    const date = document.getElementById("transactionDate").value
    const type = document.getElementById("transactionType").value
    const category = document.getElementById("transactionCategory").value
    const description = document.getElementById("transactionDescription").value
    const amount = Number.parseFloat(document.getElementById("transactionAmount").value)

    if (!date || !category || !amount) {
      alert("Please fill in all required fields!")
      return
    }

    const transaction = {
      id: Date.now(),
      date,
      type,
      category,
      description,
      amount,
    }

    this.transactions.push(transaction)
    this.saveTransactions()
    this.closeModal()
    this.updateDashboard()
    this.renderAllTransactions()
    this.updateCategoryFilterOptions()
  }

  deleteTransaction(id) {
    if (confirm("Are you sure you want to delete this transaction?")) {
      this.transactions = this.transactions.filter((t) => t.id !== id)
      this.saveTransactions()
      this.updateDashboard()
      this.renderAllTransactions()
      if (this.currentView === "analytics") {
        this.initializeCharts()
      }
    }
  }

  saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(this.transactions))
  }

  saveCategories() {
    localStorage.setItem("categories", JSON.stringify(this.categories))
  }

  // ===== Dashboard =====
  updateDashboard() {
    const monthFilter = document.getElementById("monthFilter").value
    const filtered = this.filterByMonth(monthFilter)

    const income = filtered.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const expenses = filtered.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const balance = income - expenses

    document.getElementById("totalIncome").textContent = "₹" + income.toFixed(2)
    document.getElementById("totalExpense").textContent = "₹" + expenses.toFixed(2)
    document.getElementById("totalBalance").textContent = "₹" + balance.toFixed(2)

    this.renderRecentTransactions(filtered.slice(-5).reverse())
  }

  filterByMonth(monthStr) {
    return this.transactions.filter((t) => t.date.startsWith(monthStr))
  }

  renderRecentTransactions(transactions) {
    const container = document.getElementById("recentTransactions")
    if (!transactions.length) {
      container.innerHTML = '<p class="empty-state">No transactions yet. Add one to get started!</p>'
      return
    }

    container.innerHTML = transactions
      .map(
        (t) => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-meta">${t.category} • ${new Date(t.date).toLocaleDateString("en-IN")}</div>
                </div>
                <div class="transaction-amount ${t.type}">${t.type === "income" ? "+" : "-"}₹${t.amount.toFixed(2)}</div>
                <div class="transaction-actions">
                    <button class="delete-btn" onclick="tracker.deleteTransaction(${t.id})">Delete</button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  // ===== Transactions =====
  filterTransactions() {
    const search = document.getElementById("searchInput").value.toLowerCase()
    const category = document.getElementById("categoryFilter").value
    const type = document.getElementById("typeFilter").value
    const startDate = document.getElementById("startDateFilter").value
    const endDate = document.getElementById("endDateFilter").value

    const filtered = this.transactions.filter((t) => {
      const matchSearch = t.description.toLowerCase().includes(search) || t.category.toLowerCase().includes(search)
      const matchCategory = !category || t.category === category
      const matchType = !type || t.type === type
      const matchStart = !startDate || t.date >= startDate
      const matchEnd = !endDate || t.date <= endDate

      return matchSearch && matchCategory && matchType && matchStart && matchEnd
    })

    this.renderAllTransactions(filtered)
  }

  renderAllTransactions(filtered = null) {
    const transactions = filtered || this.transactions
    const container = document.getElementById("allTransactions")

    if (!transactions.length) {
      container.innerHTML = '<p class="empty-state">No transactions found.</p>'
      return
    }

    const sorted = transactions.sort((a, b) => new Date(b.date) - new Date(a.date))

    container.innerHTML = sorted
      .map(
        (t) => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-meta">${t.category} • ${new Date(t.date).toLocaleDateString("en-IN")}</div>
                </div>
                <div class="transaction-amount ${t.type}">${t.type === "income" ? "+" : "-"}₹${t.amount.toFixed(2)}</div>
                <div class="transaction-actions">
                    <button class="delete-btn" onclick="tracker.deleteTransaction(${t.id})">Delete</button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  // ===== Analytics =====
  initializeCharts() {
    // Destroy old charts
    Object.values(this.chartInstances).forEach((chart) => {
      if (chart) chart.destroy()
    })
    this.chartInstances = {}

    // Render first chart based on active button
    const activeChart = document.querySelector(".chart-btn.active").dataset.chart
    if (activeChart === "pie") this.renderExpenseChart()
    else if (activeChart === "bar") this.renderExpenseBarChart()
    else if (activeChart === "line") this.renderExpenseLineChart()

    this.updateStatistics()
  }

  renderExpenseChart() {
    const expenses = this.transactions.filter((t) => t.type === "expense")
    const byCategory = {}

    expenses.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    })

    // Hide other charts in category section
    document.getElementById("expenseBarChart").style.display = "none"
    document.getElementById("expenseLineChart").style.display = "none"
    document.getElementById("expenseChart").style.display = "block"
    // Hide unrelated analytics charts
    document.getElementById("incomeExpenseChart").style.display = "none"
    document.getElementById("trendChart").style.display = "none"

    if (Object.keys(byCategory).length === 0) {
      document.getElementById("expenseChart").style.display = "none"
      document.getElementById("pieChartEmpty").style.display = "block"
      return
    }

    document.getElementById("pieChartEmpty").style.display = "none"

    const canvas = document.getElementById("expenseChart")
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]

    if (this.chartInstances.pie) this.chartInstances.pie.destroy()

    this.chartInstances.pie = new window.Chart(canvas, {
      type: "pie",
      data: {
        labels: Object.keys(byCategory),
        datasets: [
          {
            data: Object.values(byCategory),
            backgroundColor: colors.slice(0, Object.keys(byCategory).length),
            borderColor: "#1e293b",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#f1f5f9",
              padding: 15,
              font: { size: 12 },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => "₹" + context.raw.toFixed(2),
            },
          },
        },
      },
    })
  }

  renderIncomeExpenseChart() {
    const months = this.getLast12Months()
    const incomeData = []
    const expenseData = []

    months.forEach((month) => {
      const filtered = this.filterByMonth(month)
      const income = filtered.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
      const expense = filtered.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

      incomeData.push(income)
      expenseData.push(expense)
    })

    // Hide other charts
    document.getElementById("expenseChart").style.display = "none"
    document.getElementById("trendChart").style.display = "none"
    document.getElementById("incomeExpenseBarChart").style.display = "none"
    document.getElementById("incomeExpenseLineChart").style.display = "none"
    document.getElementById("incomeExpenseChart").style.display = "block"
    const hasData = incomeData.some((v) => v > 0) || expenseData.some((v) => v > 0)
    if (!hasData) {
      document.getElementById("incomeExpenseChart").style.display = "none"
      document.getElementById("barChartEmpty").style.display = "block"
      document.getElementById("incomeExpenseBarEmpty").style.display = "block"
      document.getElementById("incomeExpenseLineEmpty").style.display = "block"
      // Ensure message is visible in all cases
      setTimeout(() => {
        document.getElementById("barChartEmpty").style.display = "block"
        document.getElementById("incomeExpenseBarEmpty").style.display = "block"
        document.getElementById("incomeExpenseLineEmpty").style.display = "block"
      }, 50)
      return
    }
    document.getElementById("barChartEmpty").style.display = "none"
    document.getElementById("incomeExpenseBarEmpty").style.display = "none"
    document.getElementById("incomeExpenseLineEmpty").style.display = "none"
    const canvas = document.getElementById("incomeExpenseChart")
    if (this.chartInstances.bar) this.chartInstances.bar.destroy()
    this.chartInstances.bar = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: months.map((m) => new Date(m + "-01").toLocaleString("en-IN", { month: "short", year: "2-digit" })),
        datasets: [
          {
            label: "Income (₹)",
            data: incomeData,
            backgroundColor: "#10b981",
            borderColor: "#10b981",
            borderWidth: 1,
          },
          {
            label: "Expenses (₹)",
            data: expenseData,
            backgroundColor: "#ef4444",
            borderColor: "#ef4444",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#f1f5f9", font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (context) => context.dataset.label + ": ₹" + context.raw.toFixed(2),
            },
          },
        },
        scales: {
          y: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#334155" },
          },
          x: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#334155" },
          },
        },
      },
    })
  }

  renderTrendChart() {
    const last30Days = this.getLast30Days()
    const dailyExpenses = {}

    last30Days.forEach((day) => {
      dailyExpenses[day] = this.transactions
        .filter((t) => t.date === day && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)
    })

    // Hide other charts
    document.getElementById("expenseChart").style.display = "none"
    document.getElementById("incomeExpenseChart").style.display = "none"
    const hasData = Object.values(dailyExpenses).some((v) => v > 0)
    if (!hasData) {
      document.getElementById("trendChart").style.display = "none"
      document.getElementById("lineChartEmpty").style.display = "block"
      return
    }
    document.getElementById("trendChart").style.display = "block"
    document.getElementById("lineChartEmpty").style.display = "none"
    const canvas = document.getElementById("trendChart")
    if (this.chartInstances.line) this.chartInstances.line.destroy()
    this.chartInstances.line = new window.Chart(canvas, {
      type: "line",
      data: {
        labels: last30Days.map((d) => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" })),
        datasets: [
          {
            label: "Daily Spending (₹)",
            data: last30Days.map((d) => dailyExpenses[d]),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#1e293b",
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#f1f5f9", font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (context) => "₹" + context.raw.toFixed(2),
            },
          },
        },
        scales: {
          y: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#334155" },
            beginAtZero: true,
          },
          x: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#334155" },
          },
        },
      },
    })
  }

  updateStatistics() {
    const expenses = this.transactions.filter((t) => t.type === "expense")
    const income = this.transactions.filter((t) => t.type === "income")

    // Top Category
    const byCategory = {}
    expenses.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    })
    const topCategory =
      Object.keys(byCategory).length > 0
        ? Object.keys(byCategory).reduce((a, b) => (byCategory[a] > byCategory[b] ? a : b))
        : "-"

    // Average Daily Spending
    const days = new Set(expenses.map((t) => t.date)).size || 1
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0)
    const avgSpending = (totalExpense / days).toFixed(2)

    // Total Transactions
    const totalTrans = this.transactions.length

    // Savings Rate
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const savingsRate = totalIncome > 0 ? ((1 - totalExpense / totalIncome) * 100).toFixed(1) : 0

    document.getElementById("topCategory").textContent = topCategory
    document.getElementById("avgSpending").textContent = "₹" + avgSpending
    document.getElementById("totalTransactions").textContent = totalTrans
    document.getElementById("savingsRate").textContent = savingsRate + "%"
  }

  switchChart(type) {
    document.querySelectorAll(".chart-btn").forEach((btn) => btn.classList.remove("active"))
    document.querySelector(`[data-chart="${type}"]`).classList.add("active")

    if (type === "pie") this.renderExpenseChart()
    else if (type === "bar") this.renderExpenseBarChart()
    else if (type === "line") this.renderExpenseLineChart()
  }

  renderExpenseBarChart() {
    const expenses = this.transactions.filter((t) => t.type === "expense")
    const byCategory = {}
    expenses.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    })
    document.getElementById("expenseChart").style.display = "none"
    document.getElementById("expenseLineChart").style.display = "none"
    document.getElementById("expenseBarChart").style.display = "block"
    const hasData = Object.keys(byCategory).length > 0
    if (!hasData) {
      document.getElementById("expenseBarChart").style.display = "none"
      document.getElementById("barCategoryEmpty").style.display = "block"
      return
    }
    document.getElementById("barCategoryEmpty").style.display = "none"
    document.getElementById("expenseBarChart").style.display = "block"
    const canvas = document.getElementById("expenseBarChart")
    if (this.chartInstances.expenseBar) this.chartInstances.expenseBar.destroy()
    this.chartInstances.expenseBar = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: Object.keys(byCategory),
        datasets: [
          {
            label: "Expenses (₹)",
            data: Object.values(byCategory),
            backgroundColor: "#ef4444",
            borderColor: "#ef4444",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => "₹" + context.raw.toFixed(2),
            },
          },
        },
        scales: {
          y: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#334155" },
            beginAtZero: true,
          },
          x: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#334155" },
          },
        },
      },
    })
  }

  renderExpenseLineChart() {
    const expenses = this.transactions.filter((t) => t.type === "expense")
    const byCategory = {}
    expenses.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    })
    document.getElementById("expenseChart").style.display = "none"
    document.getElementById("expenseBarChart").style.display = "none"
    document.getElementById("expenseLineChart").style.display = "block"
    const hasData = Object.keys(byCategory).length > 0
    if (!hasData) {
      document.getElementById("expenseLineChart").style.display = "none"
      document.getElementById("lineCategoryEmpty").style.display = "block"
      return
    }
    document.getElementById("lineCategoryEmpty").style.display = "none"
    document.getElementById("expenseLineChart").style.display = "block"
    const canvas = document.getElementById("expenseLineChart")
    if (this.chartInstances.expenseLine) this.chartInstances.expenseLine.destroy()
    this.chartInstances.expenseLine = new window.Chart(canvas, {
      type: "line",
      data: {
        labels: Object.keys(byCategory),
        datasets: [
          {
            label: "Expenses (₹)",
            data: Object.values(byCategory),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#1e293b",
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => "₹" + context.raw.toFixed(2),
            },
          },
        },
        scales: {
          y: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#334155" },
            beginAtZero: true,
          },
          x: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#334155" },
          },
        },
      },
    })
  }

  // ===== Export Functions =====
  exportDataCSV() {
    if (this.transactions.length === 0) {
      alert("No transactions to export!")
      return
    }

    let csv = "Date,Type,Category,Description,Amount\n"

    this.transactions.forEach((t) => {
      csv += `"${t.date}","${t.type}","${t.category}","${t.description}","${t.amount}"\n`
    })

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `expense-tracker-${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  exportDataPDF() {
    if (this.transactions.length === 0) {
      alert("No transactions to export!")
      return
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;
    // Logo: use web-icon.png image before Expense Tracker
    // Make sure web-icon.png is in the public directory
    doc.addImage('web-icon.png', 'PNG', 10, 10, 18, 18);
    // Title and subtitle
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210);
    doc.text("Expense Tracker", 32, 18);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Personal Finance • India`, 32, 25);
    y = 35;
    doc.setDrawColor(25, 118, 210);
    doc.setLineWidth(0.7);
    doc.line(10, y, 200, y);
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 10, y);
    y += 10;
    // Summary box
    doc.setFillColor(230, 245, 255);
    // Calculate height for 3 lines of summary
    const summaryBoxHeight = 8 + 8 + 8 + 18; // title + 3 lines + top margin
    doc.roundedRect(10, y, 190, summaryBoxHeight, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setTextColor(25, 118, 210);
    doc.text("Summary", 15, y + 8);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const income = this.transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expenses = this.transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    // Format numbers with Indian commas
    function formatINR(num) {
      return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    // Vertically aligned summary values
    let summaryY = y + 18;
    doc.setFontSize(11);
      doc.text(`Total Income: Rs. ${formatINR(income)}`, 15, summaryY);
    summaryY += 8;
      doc.text(`Total Expenses: Rs. ${formatINR(expenses)}`, 15, summaryY);
    summaryY += 8;
      doc.text(`Balance: Rs. ${formatINR(balance)}`, 15, summaryY);
    doc.setFontSize(10);
    y = summaryY + 16; // Add extra space after summary to prevent overlap
    // Transactions Table using autoTable for best layout
    doc.setFontSize(12);
    doc.setTextColor(25, 118, 210);
    doc.text("Transactions", 10, y);
    y += 8;
    const sorted = this.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const tableBody = sorted.map(t => [
      t.date,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.category,
      t.description || '-',
      t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ]);
    if (typeof doc.autoTable !== 'function') {
      alert('PDF export failed: jsPDF autoTable plugin is not loaded. Please include jsPDF autoTable in your HTML.');
      return;
    }
    doc.autoTable({
      head: [["Date", "Type", "Category", "Description", "Amount (Rs.)"]],
      body: tableBody,
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 28 }, // Date
        1: { cellWidth: 22 }, // Type
        2: { cellWidth: 32 }, // Category
        3: { cellWidth: 70 }, // Description
        4: { cellWidth: 28, halign: 'right' } // Amount
      },
      styles: { overflow: 'linebreak', cellPadding: 2 },
      didDrawPage: function (data) {
        y = data.cursor.y + 10;
      }
    });
    // Ensure download triggers
    doc.save(`expense-tracker-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportDataJSON() {
    const data = {
      transactions: this.transactions,
      categories: this.categories,
      exportDate: new Date().toISOString(),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expense-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ===== Utilities =====
  getLast12Months() {
    const months = []
    const today = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      months.push(date.toISOString().slice(0, 7))
    }
    return months
  }

  getLast30Days() {
    const days = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      days.push(date.toISOString().slice(0, 10))
    }
    return days
  }

  clearAllData() {
    if (confirm("Are you sure? This will delete all your data permanently. This action cannot be undone.")) {
      this.transactions = []
      this.saveTransactions()
      this.updateDashboard()
      this.renderAllTransactions()
      alert("All data has been cleared!")
    }
  }
}

// Initialize
const tracker = new ExpenseTracker()
