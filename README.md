# Checkout Flow Automation

This repository contains Playwright automation tests for the **Checkout Flow**.  
It includes scenarios such as applying invalid vouchers and simulating failed payments.  
Tests can be run locally or automatically using **GitHub Actions** (CI/CD).

---

## 📌 Tech Stack
- Playwright  
- TypeScript  
- GitHub Actions (CI/CD)

---

## ⚙️ Setup & Run

# Run all tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Run a specific test file
npx playwright test tests/checkout.spec.ts

# Generate and open the report
npx playwright show-report
