import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("Request received:", res);
  console.log("Request received:", req);
    res?.status(200).json({ message: "Hello World from Next.js API!" });
}
