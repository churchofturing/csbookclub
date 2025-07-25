import { Request, Response } from 'express';

// For the /prog/ textboard this takes the hardcoded <a> and translates it
// to our textboard.
export const progRedirect = async (req: Request, res: Response) => {
  const { globalCount, postId } = req.params;
  return res.redirect(`/prog/${globalCount}/#${postId}`);
};
