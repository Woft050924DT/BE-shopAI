const express = require("express");
const cors = require("cors");
const { testConnection } = require("./helper/connectDB");
const authRouter = require("./routes/auth.routes");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "OK" });
});

app.use("/api/auth", authRouter);

async function bootstrap() {




  app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
  });
}

bootstrap();
