<?php
/**
 * OrdersTableDataStoreMeta class file.
 */

namespace Automattic\WooCommerce\Internal\DataStores\Orders;

/**
 * Mimics a WP metadata (i.e. add_metadata(), get_metadata() and friends) implementation using a custom table.
 */
class OrdersTableDataStoreMeta {

	/**
	 * Describes the structure of the metadata table.
	 *
	 * @return array Array elements: table, object_id_field, meta_id_field.
	 */
	protected function get_db_info() {
		global $wpdb;

		return array(
			'table'           => OrdersTableDataStore::get_meta_table_name(),
			'meta_id_field'   => 'id',
			'object_id_field' => 'order_id',
		);
	}

	/**
	 * Returns an array of meta for an object.
	 *
	 * @param  WC_Data $object WC_Data object.
	 * @return array
	 */
	public function read_meta( &$object ) {
		global $wpdb;

		$db_info = $this->get_db_info();

		// XXX: do we want to augment this with pre-COT metadata?
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$raw_meta_data = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT {$db_info['meta_id_field']} AS meta_id, meta_key, meta_value FROM {$db_info['table']} WHERE {$db_info['object_id_field']} = %d ORDER BY meta_id",
				$object->get_id()
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return $raw_meta_data;
	}

	/**
	 * Deletes meta based on meta ID.
	 *
	 * @param  WC_Data  $object WC_Data object.
	 * @param  stdClass $meta (containing at least ->id).
	 */
	public function delete_meta( &$object, $meta ) {
		global $wpdb;

		if ( ! is_a( $meta, 'WC_Meta_Data' ) || ! isset( $meta->id ) ) {
			return false;
		}

		$db_info = $this->get_db_info();

		$meta_id      = absint( $meta->id );
		$current_meta = $this->get_metadata_by_id( $meta_id );
		if ( $current_meta ) {
			return (bool) $wpdb->delete( $db_info['table'], array( $db_info['meta_id_field'] => $meta_id ) );
		}

		return false;
	}

	/**
	 * Add new piece of meta.
	 *
	 * @param  WC_Data  $object WC_Data object.
	 * @param  stdClass $meta (containing ->key and ->value).
	 * @return int meta ID
	 */
	public function add_meta( &$object, $meta ) {
		global $wpdb;

		if ( ! is_a( $meta, 'WC_Meta_Data' ) ) {
			return false;
		}

		$db_info = $this->get_db_info();

		$object_id  = $object->get_id();
		$meta_key   = wp_unslash( wp_slash( $meta->key ) );
		$meta_value = maybe_serialize( is_string( $meta->value ) ? wp_unslash( wp_slash( $meta->value ) ) : $meta->value );

		// phpcs:disable WordPress.DB.SlowDBQuery.slow_db_query_meta_value,WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		$result = $wpdb->insert(
			$db_info['table'],
			array(
				$db_info['object_id_field'] => $object_id,
				'meta_key'                  => $meta_key,
				'meta_value'                => $meta_value,
			)
		);
		// phpcs:enable WordPress.DB.SlowDBQuery.slow_db_query_meta_value,WordPress.DB.SlowDBQuery.slow_db_query_meta_key

		return $result ? (int) $wpdb->insert_id : false;
	}

	/**
	 * Update meta.
	 *
	 * @param  WC_Data  $object WC_Data object.
	 * @param  stdClass $meta (containing ->id, ->key and ->value).
	 */
	public function update_meta( &$object, $meta ) {
		global $wpdb;

		$current_meta = $this->get_metadata_by_id( $meta->id );
		if ( $current_meta ) {
			// phpcs:disable WordPress.DB.SlowDBQuery.slow_db_query_meta_value,WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			$data = array(
				'meta_key'   => $meta->key,
				'meta_value' => maybe_serialize( $meta->value ),
			);
			// phpcs:enable WordPress.DB.SlowDBQuery.slow_db_query_meta_value,WordPress.DB.SlowDBQuery.slow_db_query_meta_key

			$db_info = $this->get_db_info();

			$result = $wpdb->update(
				$db_info['table'],
				$data,
				array( $db_info['meta_id_field'] => $meta->id ),
				'%s',
				'%d'
			);

			return $result ? true : false;
		}

		return false;
	}

	/**
	 * Retrieves metadata by meta ID.
	 *
	 * @param int $meta_id Meta ID.
	 * @return object|bool Metadata object or FALSE if not found.
	 */
	public function get_metadata_by_id( $meta_id ) {
		global $wpdb;

		if ( ! is_numeric( $meta_id ) || floor( $meta_id ) != $meta_id ) { // phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
			return false;
		}

		$db_info = $this->get_db_info();

		$meta_id = absint( $meta_id );
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$db_info['table']} WHERE {$db_info['meta_id_field']} = %d",
				$meta_id
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		if ( empty( $meta ) ) {
			return false;
		}

		if ( isset( $meta->meta_value ) ) {
			$meta->meta_value = maybe_unserialize( $meta->meta_value );
		}

		return $meta;
	}

}