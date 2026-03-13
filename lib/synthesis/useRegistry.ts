/**
 * React hook for ERC8004Registry contract interaction.
 * Agents register their collections + ERC-8004 identity for onchain discovery.
 */
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi } from 'viem';

const REGISTRY_ABI = parseAbi([
  'function register(address collectionContract, address erc8004Identity, uint256 erc8004TokenId, string calldata name, string calldata metadataURI) external',
  'function updateMetadata(string calldata metadataURI) external',
  'function deactivate() external',
  'function reactivate() external',
  'function getAgent(address wallet) external view returns (tuple(address wallet, address collectionContract, address erc8004Identity, uint256 erc8004TokenId, string name, string metadataURI, uint256 registeredAt, bool active))',
  'function getActiveAgents() external view returns (tuple(address wallet, address collectionContract, address erc8004Identity, uint256 erc8004TokenId, string name, string metadataURI, uint256 registeredAt, bool active)[])',
  'function totalAgents() external view returns (uint256)',
  'function getAgentByIndex(uint256 index) external view returns (tuple(address wallet, address collectionContract, address erc8004Identity, uint256 erc8004TokenId, string name, string metadataURI, uint256 registeredAt, bool active))',
]);

const REGISTRY_CONTRACT = process.env.NEXT_PUBLIC_REGISTRY_CONTRACT as `0x${string}` | undefined;

export interface AgentRegistration {
  wallet: `0x${string}`;
  collectionContract: `0x${string}`;
  erc8004Identity: `0x${string}`;
  erc8004TokenId: bigint;
  name: string;
  metadataURI: string;
  registeredAt: bigint;
  active: boolean;
}

/**
 * Get agent registration by wallet address.
 */
export function useAgent(wallet?: `0x${string}`) {
  const { data, isLoading, error } = useReadContract({
    address: REGISTRY_CONTRACT,
    abi: REGISTRY_ABI,
    functionName: 'getAgent',
    args: wallet ? [wallet] : undefined,
    query: {
      enabled: !!REGISTRY_CONTRACT && !!wallet,
    },
  });

  const agent = data ? (data as AgentRegistration) : null;

  // Filter out unregistered agents (wallet === 0x0)
  const isRegistered = agent && agent.wallet !== '0x0000000000000000000000000000000000000000';

  return { agent: isRegistered ? agent : null, isLoading, error };
}

/**
 * Get all active agents for discovery.
 */
export function useActiveAgents() {
  const { data, isLoading, error } = useReadContract({
    address: REGISTRY_CONTRACT,
    abi: REGISTRY_ABI,
    functionName: 'getActiveAgents',
    query: {
      enabled: !!REGISTRY_CONTRACT,
    },
  });

  const agents = data ? (data as AgentRegistration[]) : [];

  return { agents, isLoading, error };
}

/**
 * Get total agent count (active + inactive).
 */
export function useTotalAgents() {
  const { data, isLoading, error } = useReadContract({
    address: REGISTRY_CONTRACT,
    abi: REGISTRY_ABI,
    functionName: 'totalAgents',
    query: {
      enabled: !!REGISTRY_CONTRACT,
    },
  });

  return { totalAgents: data ? Number(data) : 0, isLoading, error };
}

/**
 * Get agent by index (for enumeration).
 */
export function useAgentByIndex(index?: number) {
  const { data, isLoading, error } = useReadContract({
    address: REGISTRY_CONTRACT,
    abi: REGISTRY_ABI,
    functionName: 'getAgentByIndex',
    args: index !== undefined ? [BigInt(index)] : undefined,
    query: {
      enabled: !!REGISTRY_CONTRACT && index !== undefined,
    },
  });

  const agent = data ? (data as AgentRegistration) : null;

  return { agent, isLoading, error };
}

/**
 * Register an agent with ERC-8004 identity.
 */
export function useRegisterAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = (
    collectionContract: `0x${string}`,
    erc8004Identity: `0x${string}`,
    erc8004TokenId: number | bigint,
    name: string,
    metadataURI: string = ''
  ) => {
    if (!REGISTRY_CONTRACT) {
      throw new Error('Registry contract not configured');
    }

    writeContract({
      address: REGISTRY_CONTRACT,
      abi: REGISTRY_ABI,
      functionName: 'register',
      args: [collectionContract, erc8004Identity, BigInt(erc8004TokenId), name, metadataURI],
    });
  };

  return {
    register,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Update agent metadata URI.
 */
export function useUpdateMetadata() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const updateMetadata = (metadataURI: string) => {
    if (!REGISTRY_CONTRACT) {
      throw new Error('Registry contract not configured');
    }

    writeContract({
      address: REGISTRY_CONTRACT,
      abi: REGISTRY_ABI,
      functionName: 'updateMetadata',
      args: [metadataURI],
    });
  };

  return {
    updateMetadata,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Deactivate agent (hides from discovery).
 */
export function useDeactivateAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deactivate = () => {
    if (!REGISTRY_CONTRACT) {
      throw new Error('Registry contract not configured');
    }

    writeContract({
      address: REGISTRY_CONTRACT,
      abi: REGISTRY_ABI,
      functionName: 'deactivate',
    });
  };

  return {
    deactivate,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

/**
 * Reactivate agent.
 */
export function useReactivateAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const reactivate = () => {
    if (!REGISTRY_CONTRACT) {
      throw new Error('Registry contract not configured');
    }

    writeContract({
      address: REGISTRY_CONTRACT,
      abi: REGISTRY_ABI,
      functionName: 'reactivate',
    });
  };

  return {
    reactivate,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}
