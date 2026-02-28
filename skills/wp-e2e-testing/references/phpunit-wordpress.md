# PHPUnit for WordPress

Use this file when writing or configuring PHPUnit tests for WordPress PHP code.

## Scaffolding with WP-CLI

```bash
wp scaffold plugin-tests my-plugin
```

This creates:
- `phpunit.xml.dist` — PHPUnit configuration
- `tests/bootstrap.php` — WordPress test library loader
- `tests/test-sample.php` — Example test
- `bin/install-wp-tests.sh` — Script to install WP test library

## Running with wp-env (recommended)

wp-env includes the WordPress test suite out of the box:

```bash
npx wp-env run tests-cli --env-cwd=wp-content/plugins/my-plugin phpunit
npx wp-env run tests-cli --env-cwd=wp-content/plugins/my-plugin phpunit -- --filter=test_activation
```

## Writing tests

```php
class Test_My_Plugin extends WP_UnitTestCase {

    public function set_up(): void {
        parent::set_up();
        // Runs before each test
    }

    public function tear_down(): void {
        // Runs after each test
        parent::tear_down();
    }

    public function test_plugin_activates(): void {
        $this->assertTrue( is_plugin_active( 'my-plugin/my-plugin.php' ) );
    }

    public function test_custom_post_type_registered(): void {
        $this->assertTrue( post_type_exists( 'book' ) );
    }

    public function test_hook_fires(): void {
        $fired = false;
        add_action( 'my_plugin_init', function() use ( &$fired ) {
            $fired = true;
        });
        do_action( 'my_plugin_init' );
        $this->assertTrue( $fired );
    }

    public function test_filter_modifies_value(): void {
        add_filter( 'my_plugin_title', function( $title ) {
            return 'Modified: ' . $title;
        });
        $result = apply_filters( 'my_plugin_title', 'Original' );
        $this->assertSame( 'Modified: Original', $result );
    }
}
```

## Testing REST API endpoints

```php
class Test_REST_API extends WP_UnitTestCase {

    public function set_up(): void {
        parent::set_up();
        do_action( 'rest_api_init' );
    }

    public function test_endpoint_registered(): void {
        $routes = rest_get_server()->get_routes();
        $this->assertArrayHasKey( '/my-plugin/v1/items', $routes );
    }

    public function test_get_items(): void {
        $request  = new WP_REST_Request( 'GET', '/my-plugin/v1/items' );
        $response = rest_get_server()->dispatch( $request );
        $this->assertSame( 200, $response->get_status() );
    }

    public function test_unauthorized_access(): void {
        $request  = new WP_REST_Request( 'POST', '/my-plugin/v1/items' );
        $response = rest_get_server()->dispatch( $request );
        $this->assertSame( 401, $response->get_status() );
    }
}
```

## Test factories

```php
public function test_post_with_meta(): void {
    $post_id = self::factory()->post->create([
        'post_title'  => 'Test Post',
        'post_status' => 'publish',
    ]);
    update_post_meta( $post_id, 'my_key', 'my_value' );

    $this->assertSame( 'my_value', get_post_meta( $post_id, 'my_key', true ) );
}

public function test_user_with_role(): void {
    $user_id = self::factory()->user->create([ 'role' => 'editor' ]);
    wp_set_current_user( $user_id );

    $this->assertTrue( current_user_can( 'edit_posts' ) );
    $this->assertFalse( current_user_can( 'manage_options' ) );
}
```

## phpunit.xml.dist configuration

```xml
<phpunit bootstrap="tests/bootstrap.php" colors="true">
    <testsuites>
        <testsuite name="My Plugin">
            <directory suffix=".php">./tests/</directory>
        </testsuite>
    </testsuites>
    <coverage>
        <include>
            <directory suffix=".php">./includes/</directory>
        </include>
    </coverage>
</phpunit>
```

## Common issues

- **"Class WP_UnitTestCase not found"**: bootstrap not loading; use wp-env or re-run `bin/install-wp-tests.sh`
- **"No tests executed"**: test methods must start with `test_`; class must extend `WP_UnitTestCase`
- **Database errors**: each test runs in a transaction that rolls back; avoid `dbDelta()` in tests
- **`set_up()` not `setUp()`**: WordPress renamed the method in WP 5.9 for snake_case consistency
