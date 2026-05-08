/**
 * Vector2D.js
 * 2D Vector mathematics for physics calculations
 * Provides vector operations for position, velocity, and acceleration
 */

class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Set vector components
   */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Copy from another vector
   */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  /**
   * Clone this vector
   */
  clone() {
    return new Vector2D(this.x, this.y);
  }

  /**
   * Add another vector
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * Subtract another vector
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /**
   * Multiply by scalar
   */
  mult(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Divide by scalar
   */
  div(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  /**
   * Get magnitude (length) of vector
   */
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Get squared magnitude (faster, no sqrt)
   */
  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Normalize vector to unit length
   */
  normalize() {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  /**
   * Limit magnitude to max value
   */
  limit(max) {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.normalize().mult(max);
    }
    return this;
  }

  /**
   * Set magnitude to specific value
   */
  setMag(mag) {
    return this.normalize().mult(mag);
  }

  /**
   * Calculate dot product with another vector
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Calculate distance to another vector
   */
  dist(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate squared distance (faster)
   */
  distSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  /**
   * Get angle of vector in radians
   */
  heading() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Rotate vector by angle (radians)
   */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Linear interpolation to another vector
   */
  lerp(v, amount) {
    this.x += (v.x - this.x) * amount;
    this.y += (v.y - this.y) * amount;
    return this;
  }

  /**
   * Check if vector equals another
   */
  equals(v, epsilon = 0.0001) {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  /**
   * Reset to zero vector
   */
  zero() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  /**
   * Convert to array [x, y]
   */
  toArray() {
    return [this.x, this.y];
  }

  /**
   * Convert to string representation
   */
  toString() {
    return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  // ============================================
  // Static Methods
  // ============================================

  /**
   * Create vector from angle and magnitude
   */
  static fromAngle(angle, magnitude = 1) {
    return new Vector2D(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }

  /**
   * Create random unit vector
   */
  static random() {
    const angle = Math.random() * Math.PI * 2;
    return Vector2D.fromAngle(angle);
  }

  /**
   * Add two vectors (static)
   */
  static add(v1, v2) {
    return new Vector2D(v1.x + v2.x, v1.y + v2.y);
  }

  /**
   * Subtract two vectors (static)
   */
  static sub(v1, v2) {
    return new Vector2D(v1.x - v2.x, v1.y - v2.y);
  }

  /**
   * Multiply vector by scalar (static)
   */
  static mult(v, scalar) {
    return new Vector2D(v.x * scalar, v.y * scalar);
  }

  /**
   * Divide vector by scalar (static)
   */
  static div(v, scalar) {
    if (scalar !== 0) {
      return new Vector2D(v.x / scalar, v.y / scalar);
    }
    return new Vector2D(v.x, v.y);
  }

  /**
   * Calculate distance between two vectors (static)
   */
  static dist(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate dot product (static)
   */
  static dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  /**
   * Linear interpolation between two vectors (static)
   */
  static lerp(v1, v2, amount) {
    return new Vector2D(
      v1.x + (v2.x - v1.x) * amount,
      v1.y + (v2.y - v1.y) * amount
    );
  }

  /**
   * Calculate angle between two vectors
   */
  static angleBetween(v1, v2) {
    const dot = v1.dot(v2);
    const mag1 = v1.mag();
    const mag2 = v2.mag();
    if (mag1 === 0 || mag2 === 0) return 0;
    return Math.acos(dot / (mag1 * mag2));
  }

  /**
   * Project v1 onto v2
   */
  static project(v1, v2) {
    const scalar = v1.dot(v2) / v2.magSq();
    return Vector2D.mult(v2, scalar);
  }

  /**
   * Reflect vector across normal
   */
  static reflect(v, normal) {
    const dot = v.dot(normal);
    return Vector2D.sub(v, Vector2D.mult(normal, 2 * dot));
  }

  /**
   * Get perpendicular vector (rotate 90 degrees)
   */
  static perpendicular(v) {
    return new Vector2D(-v.y, v.x);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Vector2D;
}