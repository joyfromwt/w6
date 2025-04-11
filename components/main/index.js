import { Space_Mono } from "next/font/google";
import {
  Container,
  Header,
  Title,
  Subtitle,
  Section,
  ProjectGrid,
  ProjectCard,
  SocialLinks,
  Link
} from './styles';

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const MainComponent = () => {
  return (
    <Container className={spaceMono.className}>
      <Header>
        <Title>Hello World</Title>
        <Subtitle>Creative Developer & Designer</Subtitle>
      </Header>

      <Section>
        <ProjectGrid>
          <ProjectCard>
            <h3>Project 1</h3>
            <p>A brief description of your first project</p>
          </ProjectCard>
          <ProjectCard>
            <h3>Project 2</h3>
            <p>A brief description of your second project</p>
          </ProjectCard>
          <ProjectCard>
            <h3>Project 3</h3>
            <p>A brief description of your third project</p>
          </ProjectCard>
          <ProjectCard>
            <h3>Project 4</h3>
            <p>A brief description of your fourth project</p>
          </ProjectCard>
        </ProjectGrid>
      </Section>

      <SocialLinks>
        <Link href="https://github.com" target="_blank">GitHub</Link>
        <Link href="https://linkedin.com" target="_blank">LinkedIn</Link>
        <Link href="mailto:your@email.com">Email</Link>
      </SocialLinks>
    </Container>
  );
};

export default MainComponent; 