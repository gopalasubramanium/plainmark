#[cfg(target_os = "linux")]
#[test]
fn variant_iterator_security_backport() {
    use glib::variant::ToVariant;
    let values = ["first", "第二", "last"];
    let variant = values.to_variant();
    assert_eq!(
        variant.array_iter_str().unwrap().collect::<Vec<_>>(),
        values
    );
    assert_eq!(
        variant.array_iter_str().unwrap().rev().collect::<Vec<_>>(),
        ["last", "第二", "first"]
    );
    assert_eq!(variant.array_iter_str().unwrap().nth(1), Some("第二"));
    assert_eq!(variant.array_iter_str().unwrap().nth_back(1), Some("第二"));
    assert_eq!(variant.array_iter_str().unwrap().last(), Some("last"));
}
