import jwt from "jsonwebtoken";

export const encrypt = async (payload: { id: string }, expiresIn: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    algorithm: "HS256",
    expiresIn,
  });
};

export const decrypt = async (token: string): Promise<{ id: string }> => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
    id: string;
  };
  return decoded as { id: string };
};

export const verify = async (token: string): Promise<string> => {
  console.log(token);
  const decoded = await decrypt(token);
  console.log(decoded);
  return decoded.id;
};
