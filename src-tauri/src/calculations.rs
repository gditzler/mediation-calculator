use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variation {
    pub demand: f64,
    pub offer_needed: f64,
}

/// Standard midpoint: (demand + offer) / 2
pub fn compute_midpoint_standard(demand: f64, offer: f64) -> f64 {
    (demand + offer) / 2.0
}

/// Bracket midpoint: (high + low) / 2
pub fn compute_midpoint_bracket(high: f64, low: f64) -> f64 {
    (high + low) / 2.0
}

/// Compute the variation step size based on the magnitude of the demand.
/// Returns 10^(floor(log10(demand)) - 1), or 1000.0 if demand <= 0.
pub fn compute_variation_step(demand: f64) -> f64 {
    if demand <= 0.0 {
        return 1000.0;
    }
    let exponent = demand.log10().floor() as i32 - 1;
    10f64.powi(exponent)
}

/// Generate variations centered on `current_demand`, producing `count` pairs
/// of (demand, offer_needed) where offer_needed = 2 * midpoint - demand.
pub fn generate_variations(midpoint: f64, current_demand: f64, count: usize) -> Vec<Variation> {
    let step = compute_variation_step(current_demand);
    let half = count / 2;
    let mut variations = Vec::with_capacity(count);

    for i in 0..count {
        let offset = i as f64 - half as f64;
        let demand = current_demand + offset * step;
        let offer_needed = 2.0 * midpoint - demand;
        variations.push(Variation {
            demand,
            offer_needed,
        });
    }

    variations
}

/// Returns true if at least one round tuple has both demand and offer present
/// and has round_type == "standard".
pub fn has_standard_round_with_both(
    rounds: &[(Option<f64>, Option<f64>, String)],
) -> bool {
    rounds
        .iter()
        .any(|(d, o, rt)| d.is_some() && o.is_some() && rt == "standard")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_midpoint_standard() {
        assert!((compute_midpoint_standard(100_000.0, 50_000.0) - 75_000.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_midpoint_bracket() {
        assert!((compute_midpoint_bracket(200_000.0, 100_000.0) - 150_000.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_variation_step_normal() {
        // demand = 100_000 -> log10 = 5 -> exponent = 4 -> step = 10_000
        assert!((compute_variation_step(100_000.0) - 10_000.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_variation_step_zero() {
        assert!((compute_variation_step(0.0) - 1000.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_variation_step_negative() {
        assert!((compute_variation_step(-500.0) - 1000.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_generate_variations() {
        let variations = generate_variations(75_000.0, 100_000.0, 5);
        assert_eq!(variations.len(), 5);
        // Middle variation (index 2, offset 0) should have demand == current_demand
        assert!((variations[2].demand - 100_000.0).abs() < f64::EPSILON);
        // offer_needed = 2 * 75000 - 100000 = 50000
        assert!((variations[2].offer_needed - 50_000.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_has_standard_round_with_both() {
        let rounds = vec![
            (Some(100_000.0), Some(50_000.0), "standard".to_string()),
            (None, Some(30_000.0), "standard".to_string()),
        ];
        assert!(has_standard_round_with_both(&rounds));

        let rounds_no_match = vec![
            (None, Some(50_000.0), "standard".to_string()),
            (Some(100_000.0), None, "bracket".to_string()),
        ];
        assert!(!has_standard_round_with_both(&rounds_no_match));
    }
}
