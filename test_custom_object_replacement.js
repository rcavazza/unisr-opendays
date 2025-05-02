/**
 * Test script for the custom object replacement functionality
 * 
 * This script simulates the behavior of the modified code in server.js
 * to verify that it correctly replaces specific custom object IDs with
 * 25326449768 and removes duplicates of this ID.
 */

// Test cases
const testCases = [
    {
        name: "No target IDs",
        customObjectIds: ["12345", "67890", "54321"],
        expected: {
            uniqueIds: ["12345", "67890", "54321"],
            replacementCount: 0
        }
    },
    {
        name: "One target ID",
        customObjectIds: ["12345", "25417865498", "54321"],
        expected: {
            uniqueIds: ["12345", "25326449768", "54321"],
            replacementCount: 1
        }
    },
    {
        name: "Multiple target IDs",
        customObjectIds: ["25417865498", "25417865493", "25417865392"],
        expected: {
            uniqueIds: ["25326449768"],
            replacementCount: 3
        }
    },
    {
        name: "Mixed target and non-target IDs",
        customObjectIds: ["12345", "25417865498", "67890", "25417865493"],
        expected: {
            uniqueIds: ["12345", "25326449768", "67890"],
            replacementCount: 2
        }
    },
    {
        name: "Target IDs with different types",
        customObjectIds: ["12345", 25417865498, "67890", 25417865493],
        expected: {
            uniqueIds: ["12345", "25326449768", "67890"],
            replacementCount: 2
        }
    }
];

// Run the tests
console.log("Running custom object replacement tests...\n");

testCases.forEach(testCase => {
    console.log(`Test case: ${testCase.name}`);
    console.log(`Input: ${JSON.stringify(testCase.customObjectIds)}`);
    
    // Define the target IDs and replacement ID
    const targetIds = ['25417865498', '25417865493', '25417865392'];
    const replacementId = '25326449768';
    
    // Convert all IDs to strings for consistent comparison
    const processedCustomObjectIds = testCase.customObjectIds.map(id => {
        const strId = String(id);
        // If the ID is one of the target IDs, replace it with the replacement ID
        if (targetIds.includes(strId)) {
            console.log(`  Replacing custom object ID ${strId} with ${replacementId}`);
            return replacementId;
        }
        return strId;
    });
    
    // Remove duplicates of the replacement ID
    const uniqueCustomObjectIds = [];
    const replacementIdCount = {};
    
    processedCustomObjectIds.forEach(id => {
        // If it's the replacement ID, check if we've already added it
        if (id === replacementId) {
            if (!replacementIdCount[replacementId]) {
                replacementIdCount[replacementId] = 0;
                uniqueCustomObjectIds.push(id);
            }
            replacementIdCount[replacementId] = (replacementIdCount[replacementId] || 0) + 1;
        } else {
            // For other IDs, always add them
            uniqueCustomObjectIds.push(id);
        }
    });
    
    const replacementCount = replacementIdCount[replacementId] || 0;
    
    console.log(`  Processed IDs: ${JSON.stringify(processedCustomObjectIds)}`);
    console.log(`  Unique IDs: ${JSON.stringify(uniqueCustomObjectIds)}`);
    console.log(`  Replacement count: ${replacementCount}`);
    
    // Verify the results
    const expectedUniqueIds = JSON.stringify(testCase.expected.uniqueIds);
    const actualUniqueIds = JSON.stringify(uniqueCustomObjectIds);
    const expectedReplacementCount = testCase.expected.replacementCount;
    
    const uniqueIdsMatch = expectedUniqueIds === actualUniqueIds;
    const replacementCountMatch = expectedReplacementCount === replacementCount;
    
    if (uniqueIdsMatch && replacementCountMatch) {
        console.log("  ✅ Test passed");
    } else {
        console.log("  ❌ Test failed");
        if (!uniqueIdsMatch) {
            console.log(`    Expected unique IDs: ${expectedUniqueIds}`);
            console.log(`    Actual unique IDs: ${actualUniqueIds}`);
        }
        if (!replacementCountMatch) {
            console.log(`    Expected replacement count: ${expectedReplacementCount}`);
            console.log(`    Actual replacement count: ${replacementCount}`);
        }
    }
    
    console.log("");
});

console.log("All tests completed.");