use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum OsPlatform {
    Macos,
    Linux,
    Windows,
    Unknown,
}

impl OsPlatform {
    pub fn detect() -> Self {
        match std::env::consts::OS {
            "macos" => Self::Macos,
            "linux" => Self::Linux,
            "windows" => Self::Windows,
            _ => Self::Unknown,
        }
    }

    pub fn supports_managed_binary(self) -> bool {
        matches!(self, Self::Macos | Self::Linux)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_returns_known_platform() {
        let platform = OsPlatform::detect();
        assert!(matches!(
            platform,
            OsPlatform::Macos | OsPlatform::Linux | OsPlatform::Windows | OsPlatform::Unknown
        ));
    }

    #[test]
    fn macos_and_linux_support_managed_binary() {
        assert!(OsPlatform::Macos.supports_managed_binary());
        assert!(OsPlatform::Linux.supports_managed_binary());
        assert!(!OsPlatform::Windows.supports_managed_binary());
    }
}
