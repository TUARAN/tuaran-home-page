import unittest

from runner import allowed_hosts, validate_target


class RunnerPolicyTests(unittest.TestCase):
    def test_default_and_configured_hosts(self):
        self.assertEqual(
            allowed_hosts("example.com,*.example.com,https://bad.test,*"),
            ("2aran.com", "*.2aran.com", "example.com", "*.example.com"),
        )

    def test_target_policy(self):
        patterns = allowed_hosts("example.com")
        self.assertEqual(validate_target("https://example.com/path#fragment", patterns), "https://example.com/path")
        with self.assertRaisesRegex(ValueError, "HTTPS"):
            validate_target("http://example.com", patterns)
        with self.assertRaisesRegex(ValueError, "not authorized"):
            validate_target("https://evil.test", patterns)
        with self.assertRaisesRegex(ValueError, "IP targets"):
            validate_target("https://127.0.0.1", ("127.0.0.1",))


if __name__ == "__main__":
    unittest.main()
