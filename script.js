// Currency symbols and formatting
const currencies = {
  USD: { symbol: "$", position: "before", decimals: 2 },
  EUR: { symbol: "€", position: "before", decimals: 2 },
  INR: { symbol: "₹", position: "before", decimals: 2 },
  JPY: { symbol: "¥", position: "before", decimals: 0 },
  CNY: { symbol: "¥", position: "before", decimals: 2 },
};

let userBudget = 0;
let budgetSet = false;
let customExpenseCounter = 0;
let customExpenses = [];
let deletedDefaultExpenses = new Set();

// Calculate budget on page load
window.addEventListener("DOMContentLoaded", function () {
  updateCurrencySymbols();
  calculateBudget();
});

function setBudget() {
  const budgetInput = document.getElementById("totalBudget");
  const budget = parseFloat(budgetInput.value) || 0;

  if (budget <= 0) {
    alert("Please enter a valid budget amount");
    return;
  }

  userBudget = budget;
  budgetSet = true;

  // Hide input, show display
  budgetInput.disabled = true;
  document.querySelector(".set-budget-btn").style.display = "none";
  document.getElementById("budgetDisplay").classList.add("active");

  // Update display
  updateBudgetDisplay();
  calculateBudget();
}

function editBudget() {
  const budgetInput = document.getElementById("totalBudget");
  budgetInput.disabled = false;
  document.querySelector(".set-budget-btn").style.display = "block";
  document.getElementById("budgetDisplay").classList.remove("active");
  budgetSet = false;
}

function updateBudgetDisplay() {
  const currency = document.getElementById("currency").value;
  const spent = calculateTotalExpenses();
  const remaining = userBudget - spent;
  const percentage = userBudget > 0 ? (spent / userBudget) * 100 : 0;

  // Update budget amounts
  document.getElementById("budgetAmount").textContent =
    formatCurrency(userBudget);
  document.getElementById("remainingAmount").textContent =
    formatCurrency(remaining);

  // Update progress bar
  const budgetBar = document.getElementById("budgetBar");
  const cappedPercentage = Math.min(percentage, 100);
  budgetBar.style.width = cappedPercentage + "%";
  budgetBar.textContent = "";

  // Update bar color
  budgetBar.className = "budget-bar";
  if (percentage >= 90 && percentage < 100) {
    budgetBar.classList.add("warning");
  } else if (percentage >= 100) {
    budgetBar.classList.add("danger");
  }

  // Update status message
  const statusDiv = document.getElementById("budgetStatus");
  statusDiv.className = "budget-status";

  if (percentage < 90) {
    statusDiv.textContent = `Under budget by ${formatCurrency(remaining)}`;
    statusDiv.classList.add("under");
  } else if (percentage >= 90 && percentage < 100) {
    statusDiv.textContent = `Approaching budget limit — ${formatCurrency(remaining)} remaining`;
    statusDiv.classList.add("at");
  } else if (percentage >= 100 && percentage < 110) {
    statusDiv.textContent = `Over budget by ${formatCurrency(Math.abs(remaining))}`;
    statusDiv.classList.add("over");
  } else {
    statusDiv.textContent = `Significantly over budget by ${formatCurrency(Math.abs(remaining))}`;
    statusDiv.classList.add("over");
  }
}

function calculateTotalExpenses() {
  const days = parseFloat(document.getElementById("days").value) || 0;
  const people = parseFloat(document.getElementById("people").value) || 1;

  let total = 0;

  // Calculate default expenses if not deleted
  if (!deletedDefaultExpenses.has("travel-group")) {
    const flightCost =
      parseFloat(document.getElementById("flights").value) || 0;
    total += flightCost * people;
  }
  if (!deletedDefaultExpenses.has("accommodation-group")) {
    const accommodationCost =
      parseFloat(document.getElementById("accommodation").value) || 0;
    total += accommodationCost * days;
  }
  if (!deletedDefaultExpenses.has("food-group")) {
    const foodCost = parseFloat(document.getElementById("food").value) || 0;
    total += foodCost * people * days;
  }
  if (!deletedDefaultExpenses.has("activities-group")) {
    const activitiesCost =
      parseFloat(document.getElementById("activities").value) || 0;
    total += activitiesCost * people * days;
  }
  if (!deletedDefaultExpenses.has("transport-group")) {
    const transportCost =
      parseFloat(document.getElementById("transport").value) || 0;
    total += transportCost * days;
  }
  if (!deletedDefaultExpenses.has("miscellaneous-group")) {
    const miscCost =
      parseFloat(document.getElementById("miscellaneous").value) || 0;
    total += miscCost;
  }

  // Calculate custom expenses
  customExpenses.forEach((expense) => {
    const amount =
      parseFloat(
        document.getElementById(`custom-amount-${expense.id}`).value,
      ) || 0;
    total += amount;
  });

  return total;
}

function addCustomExpense() {
  customExpenseCounter++;
  const expenseId = customExpenseCounter;

  const expense = {
    id: expenseId,
    name: "",
    amount: 0,
  };

  customExpenses.push(expense);
  renderCustomExpenses();
}

function deleteCustomExpense(expenseId) {
  customExpenses = customExpenses.filter((exp) => exp.id !== expenseId);
  renderCustomExpenses();
  calculateBudget();
}

function deleteDefaultExpense(groupId) {
  const group = document.getElementById(groupId);
  if (group) {
    group.style.display = "none";
    deletedDefaultExpenses.add(groupId);
    calculateBudget();
  }
}

function renderCustomExpenses() {
  const container = document.getElementById("customExpensesContainer");

  if (customExpenses.length === 0) {
    container.innerHTML = `
                    <div class="no-custom-expenses">
                        No custom expenses added yet. Click "Add Expense" to create one.
                    </div>
                `;
    return;
  }

  const currency = document.getElementById("currency").value;
  const symbol = currencies[currency].symbol;

  // Store current values before re-rendering
  const currentValues = {};
  customExpenses.forEach((expense) => {
    const nameInput = document.getElementById(`custom-name-${expense.id}`);
    const amountInput = document.getElementById(`custom-amount-${expense.id}`);
    if (nameInput) currentValues[`name-${expense.id}`] = nameInput.value;
    if (amountInput) currentValues[`amount-${expense.id}`] = amountInput.value;
  });

  container.innerHTML = customExpenses
    .map(
      (expense) => `
                <div class="custom-expense-item">
                    <div class="input-group">
                        <label>Expense Name</label>
                        <input 
                            type="text" 
                            id="custom-name-${expense.id}" 
                            placeholder="e.g., Visa fees, Insurance"
                            value="${currentValues[`name-${expense.id}`] || expense.name}"
                            oninput="updateCustomExpenseName(${expense.id}, this.value)"
                        >
                    </div>
                    <div class="input-group">
                        <label>Amount</label>
                        <div class="expense-input-wrapper">
                            <div class="input-wrapper">
                                <span class="currency-symbol">${symbol}</span>
                                <input 
                                    type="number" 
                                    id="custom-amount-${expense.id}" 
                                    placeholder="0"
                                    value="${currentValues[`amount-${expense.id}`] !== undefined ? currentValues[`amount-${expense.id}`] : expense.amount || ""}"
                                    min="0"
                                    oninput="updateCustomExpenseAmount(${expense.id}, this.value)"
                                    onblur="calculateBudget()"
                                >
                            </div>
                        </div>
                    </div>
                    <button class="delete-expense-btn" onclick="deleteCustomExpense(${expense.id})" title="Delete expense">
                        ✕
                    </button>
                </div>
            `,
    )
    .join("");
}

function updateCustomExpenseName(expenseId, name) {
  const expense = customExpenses.find((exp) => exp.id === expenseId);
  if (expense) {
    expense.name = name;
  }
}

function updateCustomExpenseAmount(expenseId, amount) {
  const expense = customExpenses.find((exp) => exp.id === expenseId);
  if (expense) {
    expense.amount = parseFloat(amount) || 0;
  }
}

function updateCurrencySymbols() {
  const currency = document.getElementById("currency").value;
  const symbol = currencies[currency].symbol;
  const symbolElements = document.querySelectorAll(".currency-symbol");

  symbolElements.forEach((element) => {
    element.textContent = symbol;
  });

  // Update budget currency symbol
  document.getElementById("budgetCurrencySymbol").textContent = symbol;

  // Re-render custom expenses only to update currency symbols
  // This preserves the input values
  if (customExpenses.length > 0) {
    const customSymbols = document.querySelectorAll(
      "#customExpensesContainer .currency-symbol",
    );
    customSymbols.forEach((element) => {
      element.textContent = symbol;
    });
  }

  // Update budget display if budget is set
  if (budgetSet) {
    updateBudgetDisplay();
  }
}

function calculateBudget() {
  updateCurrencySymbols();

  // Get all input values
  const days = parseFloat(document.getElementById("days").value) || 0;
  const people = parseFloat(document.getElementById("people").value) || 1;

  let grandTotal = 0;
  const breakdown = [];

  // Calculate default expenses if not deleted
  if (!deletedDefaultExpenses.has("travel-group")) {
    const flightCost =
      parseFloat(document.getElementById("flights").value) || 0;
    const flightTotal = flightCost * people;
    grandTotal += flightTotal;
    breakdown.push({
      id: "flight",
      label: "Travel",
      icon: "✈️",
      total: flightTotal,
    });
  }

  if (!deletedDefaultExpenses.has("accommodation-group")) {
    const accommodationCost =
      parseFloat(document.getElementById("accommodation").value) || 0;
    const accommodationTotal = accommodationCost * days;
    grandTotal += accommodationTotal;
    breakdown.push({
      id: "accommodation",
      label: "Accommodation",
      icon: "🏨",
      total: accommodationTotal,
    });
  }

  if (!deletedDefaultExpenses.has("food-group")) {
    const foodCost = parseFloat(document.getElementById("food").value) || 0;
    const foodTotal = foodCost * people * days;
    grandTotal += foodTotal;
    breakdown.push({ id: "food", label: "Food", icon: "🍽️", total: foodTotal });
  }

  if (!deletedDefaultExpenses.has("activities-group")) {
    const activitiesCost =
      parseFloat(document.getElementById("activities").value) || 0;
    const activitiesTotal = activitiesCost * people * days;
    grandTotal += activitiesTotal;
    breakdown.push({
      id: "activities",
      label: "Activities",
      icon: "🎭",
      total: activitiesTotal,
    });
  }

  if (!deletedDefaultExpenses.has("transport-group")) {
    const transportCost =
      parseFloat(document.getElementById("transport").value) || 0;
    const transportTotal = transportCost * days;
    grandTotal += transportTotal;
    breakdown.push({
      id: "transport",
      label: "Local Transport",
      icon: "🚗",
      total: transportTotal,
    });
  }

  if (!deletedDefaultExpenses.has("miscellaneous-group")) {
    const miscCost =
      parseFloat(document.getElementById("miscellaneous").value) || 0;
    grandTotal += miscCost;
    breakdown.push({
      id: "misc",
      label: "Miscellaneous",
      icon: "💼",
      total: miscCost,
    });
  }

  // Add custom expenses to breakdown
  customExpenses.forEach((expense) => {
    const amount =
      parseFloat(
        document.getElementById(`custom-amount-${expense.id}`).value,
      ) || 0;
    grandTotal += amount;
    breakdown.push({
      id: `custom-${expense.id}`,
      label: expense.name || "Custom Expense",
      icon: "📌",
      total: amount,
    });
  });

  // Calculate per person cost
  const perPerson = grandTotal / people;

  // Update breakdown section
  const breakdownContainer = document.querySelector(".breakdown-section");
  const breakdownHTML = breakdown
    .map((item) => {
      const percentage =
        grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(1) : 0;
      return `
                    <div class="breakdown-item">
                        <div class="breakdown-label">
                            <div class="breakdown-icon">${item.icon}</div>
                            <span class="breakdown-text">${item.label}</span>
                        </div>
                        <div>
                            <span class="breakdown-amount">${formatCurrency(item.total)}</span>
                            <span class="percentage">(${percentage}%)</span>
                        </div>
                    </div>
                `;
    })
    .join("");

  breakdownContainer.innerHTML = `
                <h2 class="breakdown-title">Budget Breakdown</h2>
                ${breakdownHTML || '<div class="no-custom-expenses">No expenses added yet</div>'}
            `;

  // Update total section
  document.getElementById("totalAmount").textContent =
    formatCurrency(grandTotal);
  document.getElementById("perPerson").textContent =
    formatCurrency(perPerson) + " per person";

  // Update budget display if budget is set
  if (budgetSet) {
    updateBudgetDisplay();
  }
}

function formatCurrency(amount) {
  const currency = document.getElementById("currency").value;
  const currencyInfo = currencies[currency];
  const decimals = currencyInfo.decimals;

  // Format number with appropriate decimals
  let formattedAmount = amount.toFixed(decimals);

  // Add thousand separators
  const parts = formattedAmount.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  formattedAmount = parts.join(".");

  // Add currency symbol
  if (currencyInfo.position === "before") {
    return currencyInfo.symbol + formattedAmount;
  } else {
    return formattedAmount + currencyInfo.symbol;
  }
}

function resetCalculator() {
  document.getElementById("destination").value = "";
  document.getElementById("currency").value = "INR";
  document.getElementById("days").value = "";
  document.getElementById("people").value = "";
  document.getElementById("flights").value = "";
  document.getElementById("accommodation").value = "";
  document.getElementById("food").value = "";
  document.getElementById("activities").value = "";
  document.getElementById("transport").value = "";
  document.getElementById("miscellaneous").value = "";

  // Reset budget
  document.getElementById("totalBudget").value = "";
  document.getElementById("totalBudget").disabled = false;
  document.querySelector(".set-budget-btn").style.display = "block";
  document.getElementById("budgetDisplay").classList.remove("active");
  userBudget = 0;
  budgetSet = false;

  // Restore deleted default expenses
  deletedDefaultExpenses.forEach((groupId) => {
    const group = document.getElementById(groupId);
    if (group) {
      group.style.display = "block";
    }
  });
  deletedDefaultExpenses.clear();

  // Clear custom expenses
  customExpenses = [];
  customExpenseCounter = 0;
  renderCustomExpenses();

  calculateBudget();
}

// Mobile menu toggle
function toggleMenu() {
  const navLinks = document.getElementById("navLinks");
  navLinks.classList.toggle("active");
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      // Close mobile menu if open
      document.getElementById("navLinks").classList.remove("active");
    }
  });
});
