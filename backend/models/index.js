import fs from "fs";
import path from "path";
import { fileURLToPath,pathToFileURL } from "url";
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = {};

const files = fs.readdirSync(__dirname).filter((file) => file.endsWith(".js") && file !== "index.js");

for (const file of files) {
  const { default: defineModel } = await import(
    pathToFileURL(path.join(__dirname, file)).href
  );
  if (typeof defineModel !== "function") continue;
  const model = defineModel(sequelize, DataTypes);
  db[model.name] = model;
}

Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

db.sequelize = sequelize;

export default db;