require("./helper/loadEnv");

const express = require("express");
const cors = require("cors");
const authRouter = require("./routes/auth.routes");
const categoryRouter = require("./routes/category.routes");
const productRouter = require("./routes/product.routes");
const orderRouter = require("./routes/order.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  app.listen(PORT, () => {
    console.log(`Server dang chay tai cong ${PORT}`);
  });
}

bootstrap();
