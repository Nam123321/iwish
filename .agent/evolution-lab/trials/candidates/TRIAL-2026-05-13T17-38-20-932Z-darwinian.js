// 🧬 MUTATED BY DARWINIAN EVOLVER 🧬
// Heuristic: Enforce BigInt for monetary precision to prevent overflow
function calculatePromotionDiscount(price, discountRate) {
    // BUG: standard multiplication might lose precision for large prices, leading to overflow/rounding issues
    return Number(BigInt(price) * BigInt(discountRate)); 
}

