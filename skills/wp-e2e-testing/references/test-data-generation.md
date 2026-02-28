# Test Data Generation

Use this file when creating test data and fixtures for WordPress tests.

## PHPUnit: WP test factories

`WP_UnitTestCase` provides factory methods for creating test data:

```php
// Posts
$post_id = self::factory()->post->create([
    'post_title'  => 'Test Post',
    'post_status' => 'publish',
    'post_type'   => 'post',
]);

// Multiple posts
$post_ids = self::factory()->post->create_many(10, [
    'post_status' => 'publish',
]);

// Users
$user_id = self::factory()->user->create([
    'role'       => 'editor',
    'user_login' => 'testeditor',
]);

// Terms
$term_id = self::factory()->term->create([
    'taxonomy' => 'category',
    'name'     => 'Test Category',
]);

// Comments
$comment_id = self::factory()->comment->create([
    'comment_post_ID' => $post_id,
    'comment_content'  => 'Test comment',
]);

// Attachments
$attachment_id = self::factory()->attachment->create_upload_object(
    DIR_TESTDATA . '/images/canola.jpg',
    $post_id
);
```

## Playwright E2E: requestUtils

`@wordpress/e2e-test-utils-playwright` provides REST API-based data creation:

```ts
test.beforeAll(async ({ requestUtils }) => {
    await requestUtils.createPost({
        title: 'E2E Test Post',
        content: '<!-- wp:paragraph --><p>Test content</p><!-- /wp:paragraph -->',
        status: 'publish',
    });

    await requestUtils.createPage({
        title: 'Test Page',
        status: 'publish',
    });
});
```

## WP-CLI bulk data generation

```bash
# Generate posts
npx wp-env run cli wp post generate --count=50 --post_type=post --post_status=publish

# Generate users
npx wp-env run cli wp user generate --count=10 --role=subscriber

# Import theme unit test data (standard WP test content)
npx wp-env run cli wp import /tmp/theme-unit-test-data.xml --authors=create
```

## Cleanup patterns

### PHPUnit (automatic)

Each PHPUnit test runs in a database transaction that rolls back automatically. Factory-created data is cleaned up without explicit teardown.

### Playwright (manual cleanup)

```ts
test.afterAll(async ({ requestUtils }) => {
    await requestUtils.deleteAllPosts();
    await requestUtils.deleteAllPages();
});
```

### Between test runs

```bash
npx wp-env clean all  # Reset both databases to initial state
```

## Fixtures for complex scenarios

Create a reusable fixture file:

```php
// tests/fixtures/class-test-fixtures.php
class Test_Fixtures {
    public static function create_sample_store(): array {
        $category = self::factory()->term->create(['taxonomy' => 'product_cat', 'name' => 'Widgets']);
        $products = self::factory()->post->create_many(5, [
            'post_type'   => 'product',
            'post_status' => 'publish',
        ]);
        foreach ($products as $id) {
            wp_set_object_terms($id, $category, 'product_cat');
        }
        return compact('category', 'products');
    }
}
```

## Best practices

- Create the minimum data needed for each test
- Use factories over raw SQL or direct `wp_insert_post()` calls
- Name test data clearly to distinguish from real content
- Clean up E2E test data in `afterAll` hooks
- Avoid relying on auto-increment IDs; query by known attributes
