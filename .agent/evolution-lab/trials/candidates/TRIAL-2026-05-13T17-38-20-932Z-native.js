function calculatePromotionDiscount(price, discountRate) {
    // BUG: standard multiplication might lose precision for large prices, leading to overflow/rounding issues
    return Math.floor(price * discountRate); 
}
