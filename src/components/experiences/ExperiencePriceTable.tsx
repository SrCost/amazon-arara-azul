import { useTranslation } from "react-i18next";
import { buildExperiencePriceTable, formatBRL } from "@/lib/experiencePricing";

interface ExperiencePriceTableProps {
  basePrice: number;
}

const ExperiencePriceTable = ({ basePrice }: ExperiencePriceTableProps) => {
  const { t } = useTranslation();
  const rows = buildExperiencePriceTable(basePrice);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="text-left font-medium text-muted-foreground px-3 py-2">
              {t("experiencesModule.people")}
            </th>
            <th className="text-right font-medium text-muted-foreground px-3 py-2">
              {t("experiencesModule.perPerson")}
            </th>
            <th className="text-right font-medium text-muted-foreground px-3 py-2">
              {t("experiencesModule.total")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.people} className="border-t border-border">
              <td className="px-3 py-2 text-foreground">
                {row.people}
                {row.discount > 0 && (
                  <span className="ml-2 text-xs text-primary">
                    -{Math.round(row.discount * 100)}%
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-right text-muted-foreground">
                {formatBRL(row.perPerson)}
              </td>
              <td className="px-3 py-2 text-right font-medium text-foreground">
                {formatBRL(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-muted-foreground bg-muted/30">
        {t("experiencesModule.priceNote")}
      </p>
    </div>
  );
};

export default ExperiencePriceTable;
