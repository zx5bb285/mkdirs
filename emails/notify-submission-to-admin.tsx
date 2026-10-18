import { siteConfig } from "@/config/site";
import { getBaseUrl } from "@/lib/utils";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import {
  anchor,
  box,
  button,
  container,
  footer,
  footerLeft,
  footerRight,
  hr,
  main,
  paragraph,
} from "./email-formats";

interface NotifySubmissionEmailProps {
  itemName?: string;
  reviewLink?: string;
}

/**
 * https://demo.react.email/preview/welcome/stripe-welcome
 */
export const NotifySubmissionEmail = ({
  itemName,
  reviewLink,
}: NotifySubmissionEmailProps) => {
  const baseUrl = getBaseUrl();
  return (
    <Html>
      <Head />
      <Preview>New submission</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="32"
              height="32"
              alt="Logo"
            />
            <Hr style={hr} />
            <Text style={paragraph}>New submission</Text>
            <Text style={paragraph}>
              A new submission named <b>{itemName}</b> is ready to be reviewed.
            </Text>
            <Button style={button} href={reviewLink}>
              Review submission
            </Button>
            <Text style={paragraph}>
              Thanks, <br />
              The{" "}
              <Link style={anchor} href={baseUrl}>
                {siteConfig.name}
              </Link>{" "}
              team
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              <span style={footerLeft}>
                &copy; {new Date().getFullYear()}
                &nbsp;&nbsp; All Rights Reserved.
              </span>
              <span style={footerRight}>
                <Link style={anchor} href={siteConfig.links.twitter}>
                  Twitter
                </Link>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <Link style={anchor} href={siteConfig.links.github}>
                  GitHub
                </Link>
              </span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

NotifySubmissionEmail.PreviewProps = {
  itemName: "DirHunt AI",
  reviewLink: "https://dirhuntai.com",
} as NotifySubmissionEmailProps;

export default NotifySubmissionEmail;
