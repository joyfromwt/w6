import { Space_Mono } from "next/font/google";
import Link from 'next/link';
import {
  Container,
  AboutSection,
  Title,
  ContentBox,
  Paragraph,
  SkillsGrid,
  SkillCard,
  BackLink
} from './styles';

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const AboutComponent = () => {
  const skills = [
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "HTML/CSS",
    "Styled Components"
  ];

  return (
    <Container className={spaceMono.className}>
      <AboutSection>
        <Title>About Me</Title>
        <ContentBox>
          <Paragraph>
            Hello! I'm a creative developer passionate about building beautiful and functional web experiences. 
            With a background in both design and development, I strive to create interfaces that are both 
            aesthetically pleasing and user-friendly.
          </Paragraph>
          <Paragraph>
            I specialize in front-end development with a focus on React and Next.js. My approach combines 
            clean code practices with creative problem-solving to deliver exceptional digital experiences.
          </Paragraph>
        </ContentBox>

        <ContentBox>
          <Title>Skills</Title>
          <SkillsGrid>
            {skills.map((skill, index) => (
              <SkillCard key={index}>
                {skill}
              </SkillCard>
            ))}
          </SkillsGrid>
        </ContentBox>

        <Link href="/" passHref>
          <BackLink>← Back to Home</BackLink>
        </Link>
      </AboutSection>
    </Container>
  );
};

export default AboutComponent; 