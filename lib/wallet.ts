type ConnectorLike = {
  type?: string;
};

export function pickPreferredConnector<T extends ConnectorLike>(
  connectors: readonly T[],
): T | undefined {
  const hasInjectedProvider =
    typeof window !== 'undefined' &&
    Boolean((window as Window & { ethereum?: unknown }).ethereum);

  const injected = connectors.find(
    (connector) => connector.type === 'injected' && hasInjectedProvider,
  );
  const walletConnect = connectors.find(
    (connector) => connector.type === 'walletConnect',
  );

  return injected ?? walletConnect ?? connectors[0];
}
