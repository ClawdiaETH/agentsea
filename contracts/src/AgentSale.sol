// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title AgentSale
 * @notice Per-collection fixed-price sale contract for AI agent daily art.
 *         Price = startPrice + (dayNumber - 1) * priceIncrement
 *         Owner must call setApprovalForAll on the NFT contract first.
 */
contract AgentSale {
    address public nftContract;
    address public owner;
    uint256 public startPrice;
    uint256 public priceIncrement;

    struct Listing {
        uint256 dayNumber;
        uint256 price;
        bool isListed;
    }

    mapping(uint256 => Listing) private listings;

    event TokenListed(uint256 indexed tokenId, uint256 dayNumber, uint256 price);
    event TokenSold(uint256 indexed tokenId, address indexed buyer, uint256 price);

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentSale: not owner");
        _;
    }

    constructor(
        address _nftContract,
        address _owner,
        uint256 _startPrice,
        uint256 _priceIncrement
    ) {
        require(_nftContract != address(0), "AgentSale: zero nft contract");
        require(_owner != address(0), "AgentSale: zero owner");
        nftContract = _nftContract;
        owner = _owner;
        startPrice = _startPrice;
        priceIncrement = _priceIncrement;
    }

    /**
     * @notice List a token for sale. Owner must have set approval on the NFT contract.
     * @param tokenId The ERC-721 token ID to list
     * @param dayNumber The day number in the series (1-indexed)
     */
    function listToken(uint256 tokenId, uint256 dayNumber) external onlyOwner {
        require(dayNumber >= 1, "AgentSale: dayNumber must be >= 1");
        uint256 price = getPrice(dayNumber);
        listings[tokenId] = Listing({
            dayNumber: dayNumber,
            price: price,
            isListed: true
        });
        emit TokenListed(tokenId, dayNumber, price);
    }

    /**
     * @notice Buy a listed token. Send exact ETH price.
     * @param tokenId The token ID to purchase
     */
    function buy(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(listing.isListed, "AgentSale: token not listed");
        require(msg.value == listing.price, "AgentSale: wrong price");

        listing.isListed = false;

        // Transfer NFT from owner to buyer
        IERC721(nftContract).transferFrom(owner, msg.sender, tokenId);

        // Forward ETH to owner
        (bool sent, ) = payable(owner).call{value: msg.value}("");
        require(sent, "AgentSale: ETH transfer failed");

        emit TokenSold(tokenId, msg.sender, msg.value);
    }

    /**
     * @notice Get price for a given day number.
     * @param dayNumber The day number (1-indexed)
     * @return price in wei
     */
    function getPrice(uint256 dayNumber) public view returns (uint256) {
        require(dayNumber >= 1, "AgentSale: dayNumber must be >= 1");
        return startPrice + (dayNumber - 1) * priceIncrement;
    }

    /**
     * @notice Get listing details for a token.
     * @param tokenId The token ID
     * @return dayNumber, price, isListed
     */
    function getListing(uint256 tokenId) external view returns (uint256, uint256, bool) {
        Listing storage listing = listings[tokenId];
        return (listing.dayNumber, listing.price, listing.isListed);
    }

    /**
     * @notice Withdraw any ETH accidentally sent to this contract.
     */
    function rescueETH() external onlyOwner {
        (bool sent, ) = payable(owner).call{value: address(this).balance}("");
        require(sent, "AgentSale: rescue failed");
    }
}
