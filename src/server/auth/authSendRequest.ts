import MagicLinkEmail from "@/app/_components/emails/magic-link";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface Params {
  magicLink: string;
  to: string;
}
export async function sendVerificationEmail(params: Params) {
  try {
    const magicLink = params.magicLink;
    const to = params.to;

    const { data, error } = await resend.emails.send({
      from: "UofT Clubs <testing.acegrader.com>",
      to: to,
      subject: "UofT Clubs Verification",
      react: MagicLinkEmail({ magicLink }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
