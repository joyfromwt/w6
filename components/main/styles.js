import styled from 'styled-components';

export const Container = styled.div`
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #FFF;
  color: #E3E3E3;
`;

export const Header = styled.header`
  margin-bottom: 4rem;
  text-align: center;
`;

export const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  color: #E3E3E3;
  margin-bottom: 1rem;
  text-shadow: 0 0 10px rgba(227, 227, 227, 0.2);
  letter-spacing: 2px;
`;

export const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #E3E3E3;
  margin-top: 0.5rem;
  letter-spacing: 1px;
  opacity: 0.8;
`;

export const Section = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 2rem 0;
  padding: 0 1rem;
`;

export const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  width: 100%;
  margin-top: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

export const ProjectCard = styled.div`
  background: #FFF;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #E3E3E3;

  h3 {
    color: #E3E3E3;
    margin-bottom: 0.5rem;
    letter-spacing: 1px;
    font-size: 1.1rem;
  }

  p {
    color: #E3E3E3;
    letter-spacing: 0.5px;
    opacity: 0.8;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
    border-color: #E3E3E3;
    background: #F8F8F8;
  }
`;

export const SocialLinks = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
  justify-content: center;
`;

export const Link = styled.a`
  color: #E3E3E3;
  text-decoration: none;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background: transparent;
  letter-spacing: 1px;

  &:hover {
    color: #E3E3E3;
    background: #F8F8F8;
    transform: translateY(-2px);
  }
`; 