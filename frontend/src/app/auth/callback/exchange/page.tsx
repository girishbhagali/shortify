import ExchangeCallbackClient from "./ExchangeCallbackClient";

type ExchangePageProps = {
  searchParams: Promise<{
    code?: string;
    type?: string;
  }>;
};

export default async function ExchangeCallbackPage({ searchParams }: ExchangePageProps) {
  const { code, type } = await searchParams;
  return <ExchangeCallbackClient code={code} type={type} />;
}
