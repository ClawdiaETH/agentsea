// SPDX-License-Identifier: CC0-1.0
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title ProvenanceVerifier
 * @notice Verify that an NFT was minted by a registered ERC-8004 agent.
 * Links NFT ownership trail to agent identity for trust verification.
 *
 * Theme: "Agents that trust" — verifiable service quality, provenance proof.
 */
interface IERC8004Registry {
    struct AgentRegistration {
        address wallet;
        address collectionContract;
        address erc8004Identity;
        uint256 erc8004TokenId;
        string name;
        string metadataURI;
        uint256 registeredAt;
        bool active;
    }
    function agents(address) external view returns (
        address wallet,
        address collectionContract,
        address erc8004Identity,
        uint256 erc8004TokenId,
        string memory name,
        string memory metadataURI,
        uint256 registeredAt,
        bool active
    );
}

contract ProvenanceVerifier {
    IERC8004Registry public registry;

    constructor(address _registry) {
        registry = IERC8004Registry(_registry);
    }

    /**
     * @notice Verify that an NFT was minted by a registered agent.
     * @param collectionContract NFT collection address
     * @param tokenId Token ID to verify
     * @return verified True if provenance is verified
     * @return agentWallet The agent's wallet that minted the NFT
     * @return erc8004Identity The agent's ERC-8004 identity contract
     */
    function verifyProvenance(address collectionContract, uint256 tokenId)
        external
        view
        returns (bool verified, address agentWallet, address erc8004Identity)
    {
        // Get NFT contract owner (should be the agent's wallet for AgentCollectionV2)
        try IERC721(collectionContract).ownerOf(tokenId) returns (address /* currentOwner */) {
            // Check if collection contract is owned by a registered agent
            // For AgentCollectionV2, the contract owner is the agent wallet
            address collectionOwner = _getCollectionOwner(collectionContract);

            // Look up agent registration
            (
                address wallet,
                address registeredCollection,
                address identity,
                ,
                ,
                ,
                ,
                bool active
            ) = registry.agents(collectionOwner);

            // Verify:
            // 1. Agent is registered
            // 2. Agent is active
            // 3. Collection contract matches registration
            verified = (wallet != address(0) && active && registeredCollection == collectionContract);
            agentWallet = wallet;
            erc8004Identity = identity;
        } catch {
            return (false, address(0), address(0));
        }
    }

    /**
     * @notice Get the owner of a collection contract (for AgentCollectionV2).
     * @dev AgentCollectionV2 extends Ownable, so we can call owner().
     */
    function _getCollectionOwner(address collectionContract) internal view returns (address) {
        // Use low-level call to avoid reverting if contract doesn't implement owner()
        (bool success, bytes memory data) = collectionContract.staticcall(
            abi.encodeWithSignature("owner()")
        );

        if (success && data.length == 32) {
            return abi.decode(data, (address));
        }

        return address(0);
    }

    /**
     * @notice Batch verify provenance for multiple NFTs.
     */
    function batchVerifyProvenance(address collectionContract, uint256[] calldata tokenIds)
        external
        view
        returns (bool[] memory verified, address agentWallet, address erc8004Identity)
    {
        verified = new bool[](tokenIds.length);
        address wallet;
        address identity;
        bool anyVerified = false;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            (bool v, address w, address id) = this.verifyProvenance(collectionContract, tokenIds[i]);
            verified[i] = v;

            if (v && !anyVerified) {
                wallet = w;
                identity = id;
                anyVerified = true;
            }
        }

        return (verified, wallet, identity);
    }

    /**
     * @notice Get agent info for a collection contract.
     */
    function getAgentForCollection(address collectionContract)
        external
        view
        returns (
            bool registered,
            address agentWallet,
            address erc8004Identity,
            uint256 erc8004TokenId,
            string memory name
        )
    {
        address collectionOwner = _getCollectionOwner(collectionContract);

        (
            address wallet,
            address registeredCollection,
            address identity,
            uint256 tokenId,
            string memory agentName,
            ,
            ,
            bool active
        ) = registry.agents(collectionOwner);

        registered = (wallet != address(0) && active && registeredCollection == collectionContract);
        agentWallet = wallet;
        erc8004Identity = identity;
        erc8004TokenId = tokenId;
        name = agentName;
    }
}
