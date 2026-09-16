import bcrypt from "bcryptjs";
import { ROLE_TYPE_CODES, getRoleType } from "../../../constants.mjs";

const PERMISSIONS = [
  { name: "View Organizations", slug: "organization.view", module: "organization" },
  { name: "Create Organization", slug: "organization.create", module: "organization" },
  { name: "Update Organization", slug: "organization.update", module: "organization" },
  { name: "Delete Organization", slug: "organization.delete", module: "organization" },
  { name: "View Users", slug: "user.view", module: "user" },
  { name: "Create User", slug: "user.create", module: "user" },
  { name: "Update User", slug: "user.update", module: "user" },
  { name: "Delete User", slug: "user.delete", module: "user" },
  { name: "View Roles", slug: "role.view", module: "role" },
  { name: "Create Role", slug: "role.create", module: "role" },
  { name: "Update Role", slug: "role.update", module: "role" },
  { name: "Delete Role", slug: "role.delete", module: "role" },
];

const SUPER_ADMIN_EMAIL = "admin@linese.com";

export default {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      "permissions",
      PERMISSIONS.map((p) => ({ ...p, status: 1, created_at: now, updated_at: now }))
    );

    await queryInterface.bulkInsert(
      "roles",
      ROLE_TYPE_CODES.filter((r) => r.panel === "admin").map((r) => ({
        name: r.label,
        role_type: r.value,
        organization_id: null,
        status: 1,
        created_at: now,
        updated_at: now,
      }))
    );

    const password = await bcrypt.hash("Admin@123", 10);

    await queryInterface.bulkInsert("users", [
      {
        name: "Super Admin",
        email: SUPER_ADMIN_EMAIL,
        phone: "9999999999",
        password,
        status: 1,
        created_at: now,
        updated_at: now,
      },
    ]);

    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = :email LIMIT 1`,
      { replacements: { email: SUPER_ADMIN_EMAIL } }
    );
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE role_type = :type AND organization_id IS NULL LIMIT 1`,
      { replacements: { type: getRoleType("SUPER_ADMIN").value } }
    );

    await queryInterface.bulkInsert("user_roles", [
      {
        user_id: users[0].id,
        role_id: roles[0].id,
      },
    ]);

  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("user_organizations", null, {});
    await queryInterface.bulkDelete("users", { email: SUPER_ADMIN_EMAIL }, {});
    await queryInterface.bulkDelete("role_permissions", null, {});
    await queryInterface.bulkDelete("roles", { organization_id: null }, {});
    await queryInterface.bulkDelete("permissions", null, {});
  },
};