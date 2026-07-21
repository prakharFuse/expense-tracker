import express from 'express';
import cors from 'cors';
import expensesRouter from './routes/expenses.js';

const app = express();
const PORT = process.env.PORT || 4070;

app.use(cors());
app.use(express.json());

app.use('/api/expenses', expensesRouter);

app.listen(PORT, () => {
  console.log(`Expense Tracker API running on http://localhost:${PORT}`);
});
