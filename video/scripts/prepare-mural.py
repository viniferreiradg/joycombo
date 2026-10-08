# Gera os tiles do mural em public/mural (webp, nomes descritivos) e os assets do JOYCOMBO
import pymupdf, os, shutil, subprocess
base = r"C:/Users/Vini/Documents/01 claude/joycombo/"
mock = base + "video dos clientes/mockups/"
man = base + "video dos clientes/identidade visual/"
out = "public/mural"; os.makedirs(out, exist_ok=True)
tmp = "recon/mural-src"; os.makedirs(tmp, exist_ok=True)
extras = {
  "0-1.webp": "mural-01-impulsa-notebook",
  "230310_Plathanus_Case_tela_01.webp": "mural-02-plathanus-case",
  "8c6e0176512177.5c6c2503b1da8.webp": "mural-03-cakers",
  "95096a144643961.628fdbff9b565.webp": "mural-04-calmo-caixa",
  "c93ff2147434615.62c2fad2c660b.png": "mural-05-bradda-apresentacao",
  "Captura de tela 2026-10-08 141200.png": "mural-06-habitenge-site",
  "Captura de tela 2026-10-08 141314.png": "mural-07-orbitytrack-outdoor",
  "mockup-desktop-realista.webp": "mural-08-notebook-login",
  "pm5Alnb9va7BJRCSJnQc9nf5S0I.webp": "mural-09-facility-papelaria",
}
for src, name in extras.items():
    shutil.copy(mock + src, f"{tmp}/{name}{os.path.splitext(src)[1]}")
pages = [
  ("230926-attalar-manual-de-marca.pdf", 14, "mural-10-attalar-quadros"),
  ("230926-attalar-manual-de-marca.pdf", 16, "mural-11-attalar-fachada"),
  ("230926-attalar-manual-de-marca.pdf", 17, "mural-12-attalar-cartao"),
  ("230411_Milvus_Manual_UniversoVisual.pdf", 23, "mural-13-milvus-ponto"),
  ("230411_Milvus_Manual_UniversoVisual.pdf", 24, "mural-14-milvus-notebook"),
  ("241026 cerejabloom app 02 copy.pdf", 15, "mural-15-cereja-logos"),
  ("241026 cerejabloom app 02 copy.pdf", 19, "mural-16-cereja-variacoes"),
  ("221121_plathanus_manual.pdf", 26, "mural-17-plathanus-moletom"),
  ("221121_plathanus_manual.pdf", 28, "mural-18-plathanus-caneca"),
]
for f, n, name in pages:
    pymupdf.open(man + f)[n-1].get_pixmap(matrix=pymupdf.Matrix(1, 1)).save(f"{tmp}/{name}.png")
print("ok")
