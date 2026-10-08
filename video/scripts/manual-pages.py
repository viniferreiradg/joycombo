# Exporta páginas de aplicação do manual da Attalar (só a identidade do cliente)
import pymupdf, os
src = r"C:/Users/Vini/Documents/01 claude/joycombo/video dos clientes/identidade visual/230926-attalar-manual-de-marca.pdf"
out = "public/clientes/attalar/aplicacoes"; os.makedirs(out, exist_ok=True)
d = pymupdf.open(src)
for n, name in [(14, 'quadros'), (16, 'fachada'), (17, 'cartao'), (18, 'camiseta-ecobag'), (19, 'placa')]:
    d[n-1].get_pixmap(matrix=pymupdf.Matrix(1, 1)).save(f"{out}/{name}.png")
print('ok')
