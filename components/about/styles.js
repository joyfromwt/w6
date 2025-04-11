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

export const AboutSection = styled.section`
  width: 100%;
  max-width: 800px;
  margin: 4rem auto;
  padding: 0 1rem;
`;

export const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  color: #E3E3E3;
  margin-bottom: 2rem;
  text-shadow: 0 0 10px rgba(227, 227, 227, 0.2);
  letter-spacing: 2px;
  text-align: center;
`;

export const ContentBox = styled.div`
  background: #FFF;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #E3E3E3;
  margin-bottom: 2rem;
`;

export const Paragraph = styled.p`
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 1.5rem;
  letter-spacing: 0.5px;
  opacity: 0.9;
  color: #E3E3E3;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

export const SkillCard = styled.div`
  background: #FFF;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #E3E3E3;
  transition: all 0.3s ease;
  color: #E3E3E3;

  &:hover {
    transform: translateY(-3px);
    border-color: #E3E3E3;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: #F8F8F8;
  }
`;

export const BackLink = styled.a`
  color: #E3E3E3;
  text-decoration: none;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  background: transparent;
  letter-spacing: 1px;
  display: inline-block;
  margin-top: 2rem;

  &:hover {
    color: #E3E3E3;
    background: #F8F8F8;
    transform: translateY(-2px);
  }
`; 