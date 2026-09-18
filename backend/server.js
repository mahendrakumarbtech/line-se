import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import models from "./models/index.js";
import adminAuthRoutes from "./routes/admin/auth.routes.js";
import organizationRoutes from "./routes/admin/organization.routes.js";

const app = express();

app.use(helmet());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Queue Management API is running",
    });
});

app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/organizations", organizationRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await models.sequelize.authenticate();


        console.log("Database connected successfully");

        app.listen(PORT, () => {
            console.log(`Backend running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:");
        console.error(error.message);

        process.exit(1);
    }
};

startServer();