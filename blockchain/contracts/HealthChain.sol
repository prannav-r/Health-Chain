// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HealthChain
 * @dev Manages health-record cryptographic hashes, patient consent, policies,
 * deterministic premium calculation, claims, and wellness reward points.
 * Invariant: Raw health data is NEVER stored on-chain.
 */
contract HealthChain {
    string public constant VERSION = "1.0.0";
    uint256 public constant BASE_PREMIUM = 10000;

    address public owner;

    enum ClaimStatus {
        Pending,
        Approved,
        Rejected
    }

    struct HealthRecord {
        string dataHash;
        uint256 timestamp;
        string source;
        bool exists;
    }

    struct Policy {
        string policyId;
        string patientId;
        uint256 premium;
        bool active;
        uint256 createdAt;
    }

    struct Claim {
        uint256 id;
        string policyId;
        string patientId;
        uint256 amount;
        string description;
        ClaimStatus status;
        uint256 timestamp;
        string decisionReason;
    }

    // Health records: keccak256(patientId, date) => HealthRecord
    mapping(bytes32 => HealthRecord) private healthRecords;

    // Consent: keccak256(patientId, authorizedEntity) => bool
    mapping(bytes32 => bool) private consents;

    // Policies: policyId => Policy
    mapping(string => Policy) private policies;

    // Claims: claimId => Claim
    mapping(uint256 => Claim) private claims;
    uint256 private nextClaimId = 1;

    // Patient Claim IDs: patientId => claimId[]
    mapping(string => uint256[]) private patientClaimIds;

    // Wellness points: patientId => points
    mapping(string => uint256) private rewardPoints;

    // Processed reward idempotency: keccak256(patientId, date) => bool
    mapping(bytes32 => bool) private processedRewards;

    // Events
    event ContractInitialized(address indexed deployer, uint256 timestamp);
    event HealthRecordAdded(
        string indexed patientId,
        string date,
        string dataHash,
        string source,
        uint256 timestamp
    );
    event ConsentGranted(
        string indexed patientId,
        address indexed authorizedEntity,
        uint256 timestamp
    );
    event ConsentRevoked(
        string indexed patientId,
        address indexed authorizedEntity,
        uint256 timestamp
    );
    event PolicyCreated(
        string indexed policyId,
        string indexed patientId,
        uint256 premium,
        uint256 timestamp
    );
    event ClaimSubmitted(
        uint256 indexed claimId,
        string policyId,
        string indexed patientId,
        uint256 amount,
        string description,
        uint256 timestamp
    );
    event ClaimStatusUpdated(
        uint256 indexed claimId,
        ClaimStatus status,
        string reason,
        uint256 timestamp
    );
    event RewardPointsAwarded(
        string indexed patientId,
        string date,
        uint256 pointsAwarded,
        uint256 totalPoints,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit ContractInitialized(msg.sender, block.timestamp);
    }

    // -------------------------------------------------------------
    // Health Records (Cryptographic Proofs & Hashes Only)
    // -------------------------------------------------------------

    function addHealthRecord(
        string calldata patientId,
        string calldata date,
        string calldata dataHash,
        string calldata source
    ) external {
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");
        require(bytes(date).length > 0, "Date cannot be empty");
        require(bytes(dataHash).length > 0, "Data hash cannot be empty");

        bytes32 key = keccak256(abi.encodePacked(patientId, date));
        healthRecords[key] = HealthRecord({
            dataHash: dataHash,
            timestamp: block.timestamp,
            source: source,
            exists: true
        });

        emit HealthRecordAdded(patientId, date, dataHash, source, block.timestamp);
    }

    function getHealthRecord(
        string calldata patientId,
        string calldata date
    ) external view returns (string memory dataHash, uint256 timestamp, string memory source, bool exists) {
        bytes32 key = keccak256(abi.encodePacked(patientId, date));
        HealthRecord memory record = healthRecords[key];
        return (record.dataHash, record.timestamp, record.source, record.exists);
    }

    // -------------------------------------------------------------
    // Consent Management
    // -------------------------------------------------------------

    function grantConsent(string calldata patientId, address authorizedEntity) external {
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");
        require(authorizedEntity != address(0), "Invalid authorized address");

        bytes32 key = keccak256(abi.encodePacked(patientId, authorizedEntity));
        consents[key] = true;

        emit ConsentGranted(patientId, authorizedEntity, block.timestamp);
    }

    function revokeConsent(string calldata patientId, address authorizedEntity) external {
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");
        require(authorizedEntity != address(0), "Invalid authorized address");

        bytes32 key = keccak256(abi.encodePacked(patientId, authorizedEntity));
        consents[key] = false;

        emit ConsentRevoked(patientId, authorizedEntity, block.timestamp);
    }

    function hasConsent(string calldata patientId, address entity) external view returns (bool) {
        bytes32 key = keccak256(abi.encodePacked(patientId, entity));
        return consents[key];
    }

    // -------------------------------------------------------------
    // Policy & Deterministic Premium Calculation
    // -------------------------------------------------------------

    /**
     * @dev Calculates insurance premium based on activity metrics.
     * Rules:
     * - Base: 10,000
     * - Steps >= 10,000: 10% discount (-1,000)
     * - Sleep >= 7 hours: 5% discount (-500)
     * @param steps Validated daily steps
     * @param sleepHours Validated sleep duration in whole hours
     */
    function calculatePremium(uint256 steps, uint256 sleepHours) public pure returns (uint256) {
        uint256 discount = 0;

        if (steps >= 10000) {
            discount += 1000; // 10% discount
        }

        if (sleepHours >= 7) {
            discount += 500; // 5% discount
        }

        return BASE_PREMIUM - discount;
    }

    function createPolicy(
        string calldata policyId,
        string calldata patientId,
        uint256 premium
    ) external {
        require(bytes(policyId).length > 0, "Policy ID cannot be empty");
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");
        require(!policies[policyId].active, "Policy already exists");

        policies[policyId] = Policy({
            policyId: policyId,
            patientId: patientId,
            premium: premium,
            active: true,
            createdAt: block.timestamp
        });

        emit PolicyCreated(policyId, patientId, premium, block.timestamp);
    }

    function getPolicy(
        string calldata policyId
    ) external view returns (string memory patientId, uint256 premium, bool active, uint256 createdAt) {
        Policy memory policy = policies[policyId];
        require(policy.active, "Policy not found");
        return (policy.patientId, policy.premium, policy.active, policy.createdAt);
    }

    // -------------------------------------------------------------
    // Insurance Claims
    // -------------------------------------------------------------

    function submitClaim(
        string calldata policyId,
        string calldata patientId,
        uint256 amount,
        string calldata description
    ) external returns (uint256) {
        require(bytes(policyId).length > 0, "Policy ID cannot be empty");
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");
        require(amount > 0, "Claim amount must be greater than zero");

        uint256 claimId = nextClaimId++;
        claims[claimId] = Claim({
            id: claimId,
            policyId: policyId,
            patientId: patientId,
            amount: amount,
            description: description,
            status: ClaimStatus.Pending,
            timestamp: block.timestamp,
            decisionReason: ""
        });

        patientClaimIds[patientId].push(claimId);

        emit ClaimSubmitted(claimId, policyId, patientId, amount, description, block.timestamp);
        return claimId;
    }

    function approveClaim(uint256 claimId, string calldata reason) external {
        Claim storage claim = claims[claimId];
        require(claim.id != 0, "Claim does not exist");
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");

        claim.status = ClaimStatus.Approved;
        claim.decisionReason = reason;

        emit ClaimStatusUpdated(claimId, ClaimStatus.Approved, reason, block.timestamp);
    }

    function rejectClaim(uint256 claimId, string calldata reason) external {
        Claim storage claim = claims[claimId];
        require(claim.id != 0, "Claim does not exist");
        require(claim.status == ClaimStatus.Pending, "Claim is not pending");

        claim.status = ClaimStatus.Rejected;
        claim.decisionReason = reason;

        emit ClaimStatusUpdated(claimId, ClaimStatus.Rejected, reason, block.timestamp);
    }

    function getClaim(
        uint256 claimId
    )
        external
        view
        returns (
            uint256 id,
            string memory policyId,
            string memory patientId,
            uint256 amount,
            string memory description,
            ClaimStatus status,
            uint256 timestamp,
            string memory decisionReason
        )
    {
        Claim memory claim = claims[claimId];
        require(claim.id != 0, "Claim does not exist");
        return (
            claim.id,
            claim.policyId,
            claim.patientId,
            claim.amount,
            claim.description,
            claim.status,
            claim.timestamp,
            claim.decisionReason
        );
    }

    function getPatientClaimIds(string calldata patientId) external view returns (uint256[] memory) {
        return patientClaimIds[patientId];
    }

    // -------------------------------------------------------------
    // Wellness Rewards
    // -------------------------------------------------------------

    function addRewardPoints(
        string calldata patientId,
        string calldata date,
        uint256 points
    ) external {
        require(bytes(patientId).length > 0, "Patient ID cannot be empty");
        require(bytes(date).length > 0, "Date cannot be empty");
        require(points > 0, "Points must be greater than zero");

        bytes32 rewardKey = keccak256(abi.encodePacked(patientId, date));
        require(!processedRewards[rewardKey], "Reward already awarded for this record");

        processedRewards[rewardKey] = true;
        rewardPoints[patientId] += points;

        emit RewardPointsAwarded(
            patientId,
            date,
            points,
            rewardPoints[patientId],
            block.timestamp
        );
    }

    function getRewardPoints(string calldata patientId) external view returns (uint256) {
        return rewardPoints[patientId];
    }

    function isRewardProcessed(string calldata patientId, string calldata date) external view returns (bool) {
        bytes32 rewardKey = keccak256(abi.encodePacked(patientId, date));
        return processedRewards[rewardKey];
    }
}
