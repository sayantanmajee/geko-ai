/**
 * Database Mapper
 * 
 * Converts between snake_case (DB) and camelCase (Code)
 * Single source of truth for all mappings.
 */

/**
 * Convert snake_case database row to camelCase object
 */
export function mapDbRowToCamelCase(row: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {}

  for (const [key, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(key)
    mapped[camelKey] = value
  }

  return mapped
}

/**
 * Convert camelCase object to snake_case for database
 */
export function mapCamelCaseToDb(obj: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key)
    mapped[snakeKey] = value
  }

  return mapped
}

/**
 * Convert snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Convert camelCase string to snake_case
 */
export function camelToSnake(str:  string): string {
  return str.replace(/([A-Z])/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Convert SQL query to use camelCase aliases automatically
 * Usage:   generateSelectQuery("users", ["user_id", "email", "created_at"])
 * Returns:   user_id as "userId", email, created_at as "createdAt"
 */
export function generateSelectQuery(columns: string[]): string {
  return columns
    .map((col) => {
      const camelCol = snakeToCamel(col)
      if (col === camelCol) {
        // No conversion needed
        return col
      }
      return `${col} as "${camelCol}"`
    })
    .join(', ')
}