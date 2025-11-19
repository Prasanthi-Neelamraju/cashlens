// cashlens-react/src/components/Dashboard.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto'; 
import './DashboardStyles.css';

const categoryColors = {
    Food: '#00f5a0',
    Travel: '#8a6eff',
    Shopping: '#ff4f6d',
    Bills: '#f7c04a',
    Other: '#00d9f5',
};

const D_COLOR = '#f1f1f1';
const D_BORDER = 'rgba(255, 255, 255, 0.15)';
const L_COLOR = '#111';
const L_BORDER = 'rgba(0, 0, 0, 0.1)';
const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;

const calculateTotalExpenses = (expenses) => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);

};

export default function Dashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    
    const [income, setIncome] = useState(() => parseFloat(localStorage.getItem("cashlens_income")) || 0);
    const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem("cashlens_expenses")) || []);
    const [filterCategory, setFilterCategory] = useState("All");
    const [sortOption, setSortOption] = useState("dateDesc");
    const [message, setMessage] = useState(null); 
    const [isConfirm, setIsConfirm] = useState(false);
    const confirmCallbackRef = useRef(null); 

    const expensePieChartRef = useRef(null);
    const incomeBarChartRef = useRef(null);
    const pieChartInstance = useRef(null);
    const barChartInstance = useRef(null);
    
    const totalExpenses = calculateTotalExpenses(expenses);
    const balance = income - totalExpenses;
    const isLightMode = document.body.classList.contains('light-mode');
    
    const saveData = useCallback(() => {
        localStorage.setItem("cashlens_income", income);
        localStorage.setItem("cashlens_expenses", JSON.stringify(expenses));
    }, [income, expenses]);

    useEffect(() => {
        saveData();
    }, [income, expenses, saveData]);
    
    const showMessageBox = useCallback((text, confirm = false, callback = null) => {
        setMessage(text);
        setIsConfirm(confirm);
        confirmCallbackRef.current = callback;
    }, []);

    const closeMessageBox = useCallback((result) => {
        if (isConfirm && result && confirmCallbackRef.current) {
            confirmCallbackRef.current();
        }
        setMessage(null);
        setIsConfirm(false);
        confirmCallbackRef.current = null;
    }, [isConfirm]);

    const addExpense = (e) => {
        e.preventDefault();
        const title = e.target.title.value.trim();
        const amount = parseFloat(e.target.amount.value);
        const category = e.target.category.value;
        
        if (!title || isNaN(amount) || amount <= 0) {
            return showMessageBox("Enter valid expense details: a title and an amount greater than 0!");
        }

        const newExpense = { 
            id: Date.now(), 
            title, 
            amount, 
            category, 
            date: new Date().toISOString() 
        };
        
        setExpenses((prevExpenses) => [...prevExpenses, newExpense]);
        
        e.target.title.value = '';
        e.target.amount.value = '';
        setFilterCategory("All");
        setSortOption("dateDesc");
    };

    const deleteExpense = useCallback((id) => {
        setExpenses((prevExpenses) => prevExpenses.filter((e) => e.id !== id));
    }, []);

    const setIncomeHandler = (e) => {
        e.preventDefault();
        const inputEl = e.target.income.value;
        const val = parseFloat(inputEl);
        if (isNaN(val) || val < 0) {
            return showMessageBox("Enter a valid income (number ≥ 0)!");
        }
        setIncome(val);
        e.target.income.value = '';
    };
    
    const clearAllData = useCallback(() => {
        setIncome(0);
        setExpenses([]);
        localStorage.clear();
        showMessageBox("All data cleared successfully.");
    }, []);

    const requestClearData = () => {
        showMessageBox("Are you sure you want to clear ALL income and expense data? This action cannot be undone.", true, clearAllData);
    };

    const getFilteredAndSortedExpenses = useCallback(() => {
        let filtered = filterCategory === "All" 
            ? [...expenses] 
            : expenses.filter((e) => e.category === filterCategory);
        
        let sorted = filtered;

        if (sortOption === "amountAsc") sorted.sort((a, b) => a.amount - b.amount);
        else if (sortOption === "amountDesc") sorted.sort((a, b) => b.amount - a.amount);
        else if (sortOption === "titleAsc") sorted.sort((a, b) => a.title.localeCompare(b.title));
        else if (sortOption === "titleDesc") sorted.sort((a, b) => b.title.localeCompare(a.title));
        else sorted.sort((a, b) => b.id - a.id);

        return sorted;
    }, [expenses, filterCategory, sortOption]);
    
    const sortedExpenses = getFilteredAndSortedExpenses();

    const updateCharts = useCallback(() => {
        if (pieChartInstance.current) pieChartInstance.current.destroy();
        if (barChartInstance.current) barChartInstance.current.destroy();
        
        const currentAxisColor = isLightMode ? L_COLOR : D_COLOR;
        const currentGridColor = isLightMode ? L_BORDER : D_BORDER;

        const totals = {};
        expenses.forEach((e) => {
            totals[e.category] = (totals[e.category] || 0) + e.amount;
        });
        const backgroundColors = Object.keys(totals).map(cat => categoryColors[cat] || categoryColors['Other']);

        if (expensePieChartRef.current) {
            pieChartInstance.current = new Chart(expensePieChartRef.current, {
                type: "doughnut",
                data: {
                    labels: Object.keys(totals),
                    datasets: [{
                        data: Object.values(totals),
                        backgroundColor: backgroundColors,
                        borderWidth: 0,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom", labels: { color: currentAxisColor } },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    let sum = context.dataset.data.reduce((a, b) => a + b, 0);
                                    let value = context.parsed;
                                    let percentage = sum > 0 ? (value / sum * 100).toFixed(1) : 0.0;
                                    return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                },
            });
        }
        
        const balanceColor = balance >= 0 ? categoryColors.Food : categoryColors.Shopping;

        if (incomeBarChartRef.current) {
            barChartInstance.current = new Chart(incomeBarChartRef.current, {
                type: "bar",
                data: {
                    labels: ["Income", "Expenses", "Balance"],
                    datasets: [{
                        data: [income, totalExpenses, balance],
                        backgroundColor: [categoryColors.Food, categoryColors.Shopping, balanceColor],
                        borderRadius: 5,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: currentGridColor }, 
                            ticks: { color: currentAxisColor } 
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: currentAxisColor }
                        }
                    }
                },
            });
        }

    }, [expenses, income, totalExpenses, balance, isLightMode]);

    useEffect(() => {
        updateCharts();
        
        return () => {
            if (pieChartInstance.current) pieChartInstance.current.destroy();
            if (barChartInstance.current) barChartInstance.current.destroy();
        };
    }, [updateCharts]);

  const generateCategoryReportTable = () => {
    const categoryTotals = {};
    expenses.forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
        const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
        if (sortedCategories.length === 0) {
    return { __html: '<p>No expenses recorded yet.</p>' }; 
}


        let tableHTML = `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Total Spent</th>
                        <th>% of Total Expense</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedCategories.forEach(([category, amount]) => {
            const percentage = totalExpenses > 0 ? (amount / totalExpenses * 100).toFixed(1) : 0.0;
            tableHTML += `
                <tr>
                    <td>${category}</td>
                    <td>${formatCurrency(amount)}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
            <br>
            <p><strong>Total Expenses:</strong> ${formatCurrency(totalExpenses)}</p>
            <p><strong>Total Income:</strong> ${formatCurrency(income)}</p>
            <p><strong>Net Balance:</strong> ${formatCurrency(balance)}</p>
        `;

        return { __html: tableHTML };
    };

    const [activeTab, setActiveTab] = useState('transactions');

    const showTab = (tabId) => {
        setActiveTab(tabId);
    };

    const toggleTheme = () => {
        document.body.classList.toggle("light-mode");
    };
    
    const renderExpenseList = () => {
        if (sortedExpenses.length === 0) {
            return <li>No expenses recorded for this view.</li>;
        }

        return sortedExpenses.map((exp) => {
            const date = new Date(exp.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            return (
                <li key={exp.id}>
                    <span>
                        <strong>{formatCurrency(exp.amount)}</strong> - {exp.title} ({exp.category}) 
                        <small style={{ opacity: 0.7, marginLeft: '8px' }}>{date}</small>
                    </span>
                    <button 
                        className="delete-btn" 
                        onClick={() => deleteExpense(exp.id)}
                    >
                        Delete
                    </button>
                </li>
            );
        });
    };
    
    return (
        <>
 <div className="button-row">
  <button className="btn-switch-mode" onClick={toggleTheme}>
    Switch to {isLightMode ? 'Dark' : 'Light'} Mode
  </button>
  <button className="btn-logout" onClick={logout}>
    Log Out
  </button>
</div>

            <div className="dashboard-container">
                <h2>💸 CASHLENS</h2>

                <div className="tab-bar">
                    <button 
                        className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`} 
                        onClick={() => showTab('transactions')}
                    >
                        Transactions
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`} 
                        onClick={() => showTab('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`} 
                        onClick={() => showTab('reports')}
                    >
                        Reports
                    </button>
                </div>

                <div id="transactions" className={`tab-content ${activeTab === 'transactions' ? 'active' : ''}`}>
                    <div className="left-panel input-controls">
                        <div className="card summary">
                            <h3>Summary</h3>
                            <span>Income: <strong id="incomeAmount">{formatCurrency(income)}</strong></span><br />
                            <span>Expenses: <strong id="totalExpenses">{formatCurrency(totalExpenses)}</strong></span><br />
                            <span>Balance: 
                                <strong 
                                    id="balanceAmount" 
                                    style={{ color: balance < 0 ? categoryColors.Shopping : categoryColors.Food }}
                                >
                                    {formatCurrency(balance)}
                                </strong>
                            </span>
                        </div>
                        
                        <form onSubmit={setIncomeHandler} className="input-group">
                            <h3>Set Income</h3>
                            <input 
                                type="number" 
                                name="income" 
                                placeholder="Enter your total income" 
                                min="0" 
                                step="0.01" 
                                required 
                            />
                            <button type="submit">Set Income</button>
                        </form>

                        <form onSubmit={addExpense} className="input-group">
                            <h3>Add Expense</h3>
                            <input type="text" name="title" placeholder="Description (e.g., Rent, Food)" required />
                            <input type="number" name="amount" placeholder="Amount spent" min="0.01" step="0.01" required />
                            <select name="category" required>
                                <option value="Food">Food</option>
                                <option value="Travel">Travel</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Bills">Bills</option>
                                <option value="Other">Other</option>
                            </select>
                            <button type="submit">Add Expense</button>
                        </form>
                        <button className="clear-btn" onClick={requestClearData}>Reset All Data</button>
                    </div>

                    <div className="left-panel list-view">
                        <h3>Expense List</h3>
                        <select 
                            value={filterCategory} 
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            <option value="Food">Food</option>
                            <option value="Travel">Travel</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Bills">Bills</option>
                            <option value="Other">Other</option>
                        </select>

                        <select 
                            value={sortOption} 
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="dateDesc">Sort By (Latest)</option>
                            <option value="amountAsc">Amount ↑</option>
                            <option value="amountDesc">Amount ↓</option>
                            <option value="titleAsc">Title A–Z</option>
                            <option value="titleDesc">Title Z–A</option>
                        </select>

                        <ul id="expenseList">
                            {renderExpenseList()}
                        </ul>
                    </div>
                </div>

                <div id="dashboard" className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
                    <div className="dashboard-view">
                        <div className="card">
                            <h3>Expense Breakdown</h3>
                            <canvas ref={expensePieChartRef}></canvas>
                        </div>
                        <div className="card">
                            <h3>Income vs Expenses</h3>
                            <canvas ref={incomeBarChartRef}></canvas>
                        </div>
                    </div>
                </div>
                
                <div id="reports" className={`tab-content ${activeTab === 'reports' ? 'active' : ''}`}>
                    <div className="report-view">
                        <div className="card" style={{ width: '100%' }}>
                            <h3>📊 Detailed Category Report</h3>
                            <div 
                                id="reportOutput"
                                dangerouslySetInnerHTML={generateCategoryReportTable()}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {message && (
                <div id="messageBox" className="message-box" style={{ display: 'flex' }}>
                    <div className="message-content">
                        <p id="messageText">{message}</p>
                        <div className="message-buttons">
                            <button id="messageOk" onClick={() => closeMessageBox(true)}>
                                {isConfirm ? 'Yes, Clear All' : 'OK'}
                            </button>
                            {isConfirm && (
                                <button id="messageCancel" className="clear-btn" onClick={() => closeMessageBox(false)}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}