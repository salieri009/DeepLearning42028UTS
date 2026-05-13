import styled from "styled-components";

export const Card = styled.section`
  background: ${({ theme }) => theme.color.surface};
  border: 1px solid ${({ theme }) => theme.color.borderSubtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.sm};
`;

export const CardHeader = styled.header`
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.color.borderSubtle};
`;

export const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
`;

