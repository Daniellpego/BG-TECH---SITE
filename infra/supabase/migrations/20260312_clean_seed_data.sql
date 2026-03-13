-- Migration: Limpar todos os dados de seed/teste antes do deploy em produção
-- Data: 2026-03-12
-- Motivo: O Gustavo vai preencher os dados reais do zero

-- Ordem respeitando foreign keys (tabelas dependentes primeiro)
DELETE FROM historico_decisoes;
DELETE FROM projecoes;
DELETE FROM metas_financeiras;
DELETE FROM emprestimo_socio;
DELETE FROM gastos_variaveis;
DELETE FROM custos_fixos;
DELETE FROM receitas;
DELETE FROM caixa;
