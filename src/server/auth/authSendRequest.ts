import MagicLinkEmail from "@/app/_components/emails/magic-link";
import resend from "../lib/resend";

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
    console.log(magicLink);

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
