import bcrypt from "bcryptjs";
import { Router } from "express";
import { createStaffSchema, loginSchema, registerGymSchema } from "@restfit/shared";
import { newJoinCode } from "../lib/codes.js";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { auth, requireAuth, requireRole, signToken } from "../middleware/auth.js";

export const authRouter = Router();

const publicStaff = { id: true, name: true, email: true, role: true, gymId: true } as const;

async function uniqueJoinCode(gymName: string) {
  for (;;) {
    const code = newJoinCode(gymName);
    if (!(await db.gym.findUnique({ where: { joinCode: code } }))) return code;
  }
}

// Creates a gym and its owner account in one step.
authRouter.post("/register", async (req, res) => {
  const input = registerGymSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const staff = await db.staff.create({
    data: {
      name: input.ownerName,
      email: input.email,
      passwordHash,
      role: "OWNER",
      gym: { create: { name: input.gymName, phone: input.phone, joinCode: await uniqueJoinCode(input.gymName) } },
    },
    select: { ...publicStaff, gym: true },
  });
  res.status(201).json({ token: signToken({ staffId: staff.id, gymId: staff.gymId, role: staff.role }), staff });
});

authRouter.post("/login", async (req, res) => {
  const input = loginSchema.parse(req.body);
  const staff = await db.staff.findUnique({ where: { email: input.email }, include: { gym: true } });
  if (!staff || !staff.active || !(await bcrypt.compare(input.password, staff.passwordHash))) {
    throw new HttpError(401, "Wrong email or password");
  }
  const { passwordHash: _, ...safe } = staff;
  res.json({ token: signToken({ staffId: staff.id, gymId: staff.gymId, role: staff.role }), staff: safe });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const staff = await db.staff.findUniqueOrThrow({ where: { id: auth(req).staffId }, select: { ...publicStaff, gym: true } });
  res.json(staff);
});

export const staffRouter = Router();
staffRouter.use(requireAuth);

staffRouter.get("/", async (req, res) => {
  res.json(await db.staff.findMany({ where: { gymId: auth(req).gymId }, select: { ...publicStaff, active: true }, orderBy: { createdAt: "asc" } }));
});

staffRouter.post("/", requireRole("OWNER", "ADMIN"), async (req, res) => {
  const { password, ...input } = createStaffSchema.parse(req.body);
  const staff = await db.staff.create({
    data: { ...input, passwordHash: await bcrypt.hash(password, 10), gymId: auth(req).gymId },
    select: publicStaff,
  });
  res.status(201).json(staff);
});
